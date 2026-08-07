const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

const router = express.Router();

// GET tous les réglages — PUBLIC (contact, réseaux sociaux, accueil sont affichés publiquement)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT setting_key, setting_value, value_type, category, description FROM site_settings WHERE 1=1';
    const params = [];
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += ' ORDER BY category, setting_key';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

// PUT mettre à jour un réglage — PROTÉGÉ, permission manage_settings
router.put('/:key', verifyToken, checkPermission('manage_settings'), async (req, res) => {
  try {
    const { setting_value } = req.body;
    const result = await pool.query(
      `UPDATE site_settings SET setting_value=$1, updated_by=$2, updated_at=NOW()
       WHERE setting_key=$3 RETURNING *`,
      [setting_value, req.user.id, req.params.key]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Réglage non trouvé' });
    await logAction(req.user.id, 'update_setting', 'site_settings', null, { key: req.params.key }, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

module.exports = router;
