const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

const router = express.Router();

// GET tous les rôles — PROTÉGÉ, permission manage_roles
router.get('/', verifyToken, checkPermission('manage_roles'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

// GET les permissions d'un rôle précis
router.get('/:id/permissions', verifyToken, checkPermission('manage_roles'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT permissions.* FROM permissions
       JOIN role_permissions ON role_permissions.permission_id = permissions.id
       WHERE role_permissions.role_id = $1
       ORDER BY permissions.module, permissions.name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

// POST créer un rôle personnalisé (non-système)
router.post('/', verifyToken, checkPermission('manage_roles'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO roles (name, description, is_system) VALUES ($1,$2,FALSE) RETURNING *',
      [name, description]
    );
    await logAction(req.user.id, 'create', 'role', result.rows[0].id, { name }, req);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

// PUT ajouter/retirer une permission à un rôle
router.put('/:id/permissions', verifyToken, checkPermission('manage_roles'), async (req, res) => {
  try {
    const { permission_ids } = req.body; // tableau complet des permissions à assigner
    if (!Array.isArray(permission_ids)) {
      return res.status(400).json({ error: 'permission_ids doit être un tableau' });
    }

    await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [req.params.id]);
    if (permission_ids.length > 0) {
      const values = permission_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`, [req.params.id, ...permission_ids]);
    }
    await logAction(req.user.id, 'update_permissions', 'role', req.params.id, { permission_ids }, req);
    res.json({ message: 'Permissions mises à jour' });
  } catch (err) { sendError(res, err); }
});

// DELETE un rôle non-système
router.delete('/:id', verifyToken, checkPermission('manage_roles'), async (req, res) => {
  try {
    const roleCheck = await pool.query('SELECT is_system FROM roles WHERE id = $1', [req.params.id]);
    if (roleCheck.rows.length === 0) return res.status(404).json({ error: 'Rôle non trouvé' });
    if (roleCheck.rows[0].is_system) return res.status(403).json({ error: 'Impossible de supprimer un rôle système' });

    await pool.query('DELETE FROM roles WHERE id=$1', [req.params.id]);
    await logAction(req.user.id, 'delete', 'role', req.params.id, null, req);
    res.json({ message: 'Rôle supprimé' });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
