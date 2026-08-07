const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM themes ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query('INSERT INTO themes (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM themes WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Thème non trouvé' });
    res.json({ message: 'Thème supprimé' });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
