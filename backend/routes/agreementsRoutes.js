const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole, checkPermission } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { withAuditContext } = require('../lib/auditContext');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { partner_id, status } = req.query;
    let query = `SELECT agreements.*, partners.name AS partner_name FROM agreements JOIN partners ON agreements.partner_id = partners.id WHERE 1=1`;
    const params = [];
    if (partner_id) { params.push(partner_id); query += ` AND agreements.partner_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND agreements.status = $${params.length}`; }
    query += ' ORDER BY agreements.start_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/expiring-soon', verifyToken, checkPermission('agreements.view'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agreements_expiring_soon');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agreements WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Accord non trouvé' });
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkPermission('agreements.create'), async (req, res) => {
  try {
    const { partner_id, title, type, description, terms_conditions, fichier_pdf, signature_date, start_date, end_date, status } = req.body;
    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
    }
    const result = await pool.query(
      `INSERT INTO agreements (partner_id, title, type, description, terms_conditions, fichier_pdf, signature_date, start_date, end_date, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [partner_id, title, type, description, terms_conditions, fichier_pdf, signature_date, start_date, end_date, status || 'active', req.user.id]
    );
    await logAction(req.user.id, 'create', 'agreement', result.rows[0].id, null, req);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkPermission('agreements.edit'), async (req, res) => {
  try {
    const { partner_id, title, type, description, terms_conditions, fichier_pdf, signature_date, start_date, end_date, status } = req.body;
    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
    }
    const row = await withAuditContext(req.user.id, req.ip, async (client) => {
      const result = await client.query(
        `UPDATE agreements SET partner_id=$1, title=$2, type=$3, description=$4, terms_conditions=$5,
         fichier_pdf=$6, signature_date=$7, start_date=$8, end_date=$9, status=$10 WHERE id=$11 RETURNING *`,
        [partner_id, title, type, description, terms_conditions, fichier_pdf, signature_date, start_date, end_date, status, req.params.id]
      );
      return result.rows[0];
    });
    if (!row) return res.status(404).json({ error: 'Accord non trouvé' });
    res.json(row);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkPermission('agreements.delete'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM agreements WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Accord non trouvé' });
    await logAction(req.user.id, 'delete', 'agreement', req.params.id, null, req);
    res.json({ message: 'Accord supprimé', deleted: result.rows[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
