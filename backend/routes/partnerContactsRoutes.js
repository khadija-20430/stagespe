const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole, checkPermission } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

const router = express.Router();

router.get('/partner/:partnerId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, position, email, phone, is_primary FROM partner_contacts WHERE partner_id = $1 AND is_public = TRUE',
      [req.params.partnerId]
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/partner/:partnerId/all', verifyToken, checkPermission('partners.view'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM partner_contacts WHERE partner_id = $1', [req.params.partnerId]);
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkPermission('partners.edit'), async (req, res) => {
  try {
    const { partner_id, full_name, position, email, phone, is_primary, is_public, user_id } = req.body;
    const result = await pool.query(
      `INSERT INTO partner_contacts (partner_id, full_name, position, email, phone, is_primary, is_public, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [partner_id, full_name, position, email, phone, is_primary || false, is_public || false, user_id || null]
    );
    await logAction(req.user.id, 'create', 'partner_contact', result.rows[0].id, null, req);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkPermission('partners.edit'), async (req, res) => {
  try {
    const { full_name, position, email, phone, is_primary, is_public, user_id } = req.body;
    const result = await pool.query(
      `UPDATE partner_contacts SET full_name=$1, position=$2, email=$3, phone=$4, is_primary=$5,
       is_public=$6, user_id=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [full_name, position, email, phone, is_primary, is_public, user_id || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contact non trouvé' });
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkPermission('partners.edit'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM partner_contacts WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contact non trouvé' });
    await logAction(req.user.id, 'delete', 'partner_contact', req.params.id, null, req);
    res.json({ message: 'Contact supprimé' });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
