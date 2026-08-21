const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole, checkPermission } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM document_categories ORDER BY label ASC');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkPermission('reference_data.manage'), async (req, res) => {
  try {
    const { code, label } = req.body;
    const result = await pool.query('INSERT INTO document_categories (code, label) VALUES ($1,$2) RETURNING *', [code, label]);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkPermission('reference_data.manage'), async (req, res) => {
  try {
    const { code, label } = req.body;
    const result = await pool.query('UPDATE document_categories SET code=$1, label=$2 WHERE id=$3 RETURNING *', [code, label, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM document_categories WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Catégorie non trouvée' });
    res.json({ message: 'Catégorie supprimée' });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
