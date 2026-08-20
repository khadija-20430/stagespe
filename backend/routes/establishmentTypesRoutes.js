const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM establishment_types ORDER BY label ASC');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { label } = req.body;
    const result = await pool.query('INSERT INTO establishment_types (label) VALUES ($1) RETURNING *', [label]);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { label } = req.body;
    const result = await pool.query('UPDATE establishment_types SET label=$1 WHERE id=$2 RETURNING *', [label, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Type d\'établissement non trouvé' });
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM establishment_types WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Type d\'établissement non trouvé' });
    res.json({ message: 'Type d\'établissement supprimé' });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
