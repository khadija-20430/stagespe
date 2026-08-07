const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

const router = express.Router();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

function isPasswordValid(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  try {
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

    const recentFailures = await pool.query(
      `SELECT COUNT(*) FROM login_history
       WHERE email_attempted = $1 AND success = FALSE
         AND created_at > NOW() - INTERVAL '${LOCKOUT_WINDOW_MINUTES} minutes'`,
      [email]
    );
    if (parseInt(recentFailures.rows[0].count) >= MAX_FAILED_ATTEMPTS) {
      return res.status(423).json({ error: `Trop de tentatives échouées. Réessayez dans ${LOCKOUT_WINDOW_MINUTES} minutes.` });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email]);
    const user = result.rows[0];
    const validPassword = user ? await bcrypt.compare(password, user.password_hash) : false;

    await pool.query(
      'INSERT INTO login_history (user_id, email_attempted, success, ip_address, user_agent) VALUES ($1,$2,$3,$4,$5)',
      [user ? user.id : null, email, validPassword, ip, userAgent]
    );

    if (!user || !validPassword) {
      await logAction(null, 'login_failed', 'user', null, { email }, req);
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { id: user.id, full_name: user.full_name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    await logAction(user.id, 'login_success', 'user', user.id, null, req);

    res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } });
  } catch (err) { sendError(res, err); }
});

router.post('/logout', verifyToken, async (req, res) => {
  await logAction(req.user.id, 'logout', 'user', req.user.id, null, req);
  res.json({ message: 'Déconnecté avec succès' });
});

router.get('/me', verifyToken, (req, res) => {
  res.json(req.user);
});

// POST /register — réservé au super_admin (création de comptes = tâche système)
router.post('/register', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    if (!isPasswordValid(password)) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre' });
    }
    if (role && !['super_admin', 'admin', 'utilisateur'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4) RETURNING id, full_name, email, role, is_active, created_at`,
      [full_name, email, password_hash, role || 'utilisateur']
    );

    await logAction(req.user.id, 'create', 'user', result.rows[0].id, { email }, req);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.get('/users', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, is_active, last_login, created_at FROM users ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.put('/users/:id/activate', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING id, full_name, email, is_active',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    await logAction(req.user.id, 'activate_user', 'user', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/users/:id/deactivate', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id, full_name, email, is_active',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    await logAction(req.user.id, 'deactivate_user', 'user', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/users/:id/role', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['super_admin', 'admin', 'utilisateur'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, role',
      [role, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    await logAction(req.user.id, 'update_role', 'user', req.params.id, { new_role: role }, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.get('/login-history', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT login_history.*, users.full_name
       FROM login_history LEFT JOIN users ON login_history.user_id = users.id
       ORDER BY login_history.created_at DESC LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ message: 'Si ce compte existe, un lien de réinitialisation a été généré.' });
    }

    const userId = result.rows[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)', [userId, token, expiresAt]);
    res.json({ message: 'Lien de réinitialisation généré.', reset_token: token });
  } catch (err) { sendError(res, err); }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!isPasswordValid(new_password)) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre' });
    }

    const result = await pool.query(`SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()`, [token]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Lien invalide ou expiré' });

    const resetToken = result.rows[0];
    const password_hash = await bcrypt.hash(new_password, 10);

    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [password_hash, resetToken.user_id]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [resetToken.id]);
    await logAction(resetToken.user_id, 'password_reset', 'user', resetToken.user_id, null, req);

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
