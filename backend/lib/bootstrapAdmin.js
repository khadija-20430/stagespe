const bcrypt = require('bcryptjs');
const pool = require('../db');

// Exécuté au démarrage du serveur. Ne crée le compte QUE s'il n'existe pas
// déjà (vérifié par email) — jamais de doublon, jamais d'écrasement silencieux
// d'un mot de passe déjà en place.
async function ensureSuperAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME || 'Super Administrateur';

  if (!email || !password) {
    console.log('[BOOTSTRAP ADMIN] ADMIN_EMAIL / ADMIN_PASSWORD absents du .env — création automatique ignorée.');
    return;
  }

  try {
    const existing = await pool.query('SELECT id, role FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log(`[BOOTSTRAP ADMIN] Le compte ${email} existe déjà (id ${existing.rows[0].id}, rôle ${existing.rows[0].role}) — aucune action.`);
      return;
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      console.log('[BOOTSTRAP ADMIN] ❌ ADMIN_PASSWORD trop faible (8+ car., majuscule, minuscule, chiffre requis) — création annulée.');
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role) VALUES ($1,$2,$3,'super_admin') RETURNING id, email, role`,
      [fullName, email, password_hash]
    );
    console.log('[BOOTSTRAP ADMIN] ✅ Compte super_admin créé avec succès :', result.rows[0]);
  } catch (err) {
    console.error('[BOOTSTRAP ADMIN] ❌ Erreur lors de la création automatique :', err.message);
  }
}

module.exports = ensureSuperAdmin;
