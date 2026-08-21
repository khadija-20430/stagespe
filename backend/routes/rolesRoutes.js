const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

const router = express.Router();

// GET tous les rôles, avec le nombre de comptes qui l'utilisent
router.get('/', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT roles.*, COUNT(users.id) AS users_count
       FROM roles LEFT JOIN users ON users.role_id = roles.id
       GROUP BY roles.id ORDER BY roles.id ASC`
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

// GET le détail d'un rôle : ses infos + la liste des permissions déjà cochées
router.get('/:id', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const role = await pool.query('SELECT * FROM roles WHERE id = $1', [req.params.id]);
    if (role.rows.length === 0) return res.status(404).json({ error: 'Rôle non trouvé' });

    const permissions = await pool.query(
      `SELECT permissions.* FROM permissions
       JOIN role_permissions ON role_permissions.permission_id = permissions.id
       WHERE role_permissions.role_id = $1
       ORDER BY permissions.module, permissions.action`,
      [req.params.id]
    );

    res.json({ ...role.rows[0], permissions: permissions.rows });
  } catch (err) { sendError(res, err); }
});

// POST créer un nouveau rôle personnalisé, avec sa liste de permissions cochées
// body : { name, description, permission_ids: [1, 4, 7, ...] }
router.post('/', verifyToken, checkRole('super_admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, description, permission_ids } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom du rôle est requis' });

    await client.query('BEGIN');
    const role = await client.query(
      'INSERT INTO roles (name, description, is_system, created_by) VALUES ($1,$2,FALSE,$3) RETURNING *',
      [name, description || null, req.user.id]
    );

    if (Array.isArray(permission_ids) && permission_ids.length > 0) {
      const values = permission_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`, [role.rows[0].id, ...permission_ids]);
    }

    await client.query('COMMIT');
    await logAction(req.user.id, 'create', 'role', role.rows[0].id, { name, permission_ids }, req);
    res.status(201).json(role.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

// PUT modifier le nom/description d'un rôle (pas ses permissions, voir la route dédiée)
router.put('/:id', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const roleCheck = await pool.query('SELECT is_system FROM roles WHERE id = $1', [req.params.id]);
    if (roleCheck.rows.length === 0) return res.status(404).json({ error: 'Rôle non trouvé' });
    if (roleCheck.rows[0].is_system) return res.status(403).json({ error: 'Impossible de modifier un rôle système' });

    const { name, description } = req.body;
    const result = await pool.query('UPDATE roles SET name=$1, description=$2 WHERE id=$3 RETURNING *', [name, description, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

// PUT /:id/permissions — LE TOGGLE : remplace entièrement la liste des permissions
// cochées pour ce rôle. body : { permission_ids: [1, 4, 7, ...] } (liste complète,
// pas juste celle qu'on ajoute — le frontend envoie l'état complet de la grille
// à chaque clic, ou accumule puis envoie en un coup, selon ce que fait Khadidja).
router.put('/:id/permissions', verifyToken, checkRole('super_admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { permission_ids } = req.body;
    if (!Array.isArray(permission_ids)) return res.status(400).json({ error: 'permission_ids doit être un tableau' });

    await client.query('BEGIN');
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [req.params.id]);
    if (permission_ids.length > 0) {
      const values = permission_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`, [req.params.id, ...permission_ids]);
    }
    await client.query('COMMIT');
    await logAction(req.user.id, 'update_permissions', 'role', req.params.id, { permission_ids }, req);
    res.json({ message: 'Permissions mises à jour', permission_ids });
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

// Bascule UNE seule permission (pratique pour un bouton toggle individuel dans
// la grille, plutôt que de renvoyer toute la liste à chaque clic)
// body : { permission_id, enabled: true|false }
router.put('/:id/permissions/toggle', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const { permission_id, enabled } = req.body;
    if (enabled) {
      await pool.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [req.params.id, permission_id]
      );
    } else {
      await pool.query('DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2', [req.params.id, permission_id]);
    }
    await logAction(req.user.id, enabled ? 'grant_permission' : 'revoke_permission', 'role', req.params.id, { permission_id }, req);
    res.json({ role_id: Number(req.params.id), permission_id, enabled });
  } catch (err) { sendError(res, err); }
});

// DELETE un rôle personnalisé (jamais un rôle système)
router.delete('/:id', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const roleCheck = await pool.query('SELECT is_system FROM roles WHERE id = $1', [req.params.id]);
    if (roleCheck.rows.length === 0) return res.status(404).json({ error: 'Rôle non trouvé' });
    if (roleCheck.rows[0].is_system) return res.status(403).json({ error: 'Impossible de supprimer un rôle système' });

    await pool.query('UPDATE users SET role_id = NULL WHERE role_id = $1', [req.params.id]);
    await pool.query('DELETE FROM roles WHERE id=$1', [req.params.id]);
    await logAction(req.user.id, 'delete', 'role', req.params.id, null, req);
    res.json({ message: 'Rôle supprimé' });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
