const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole, checkPermission } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { country_id } = req.query;
    let query = 'SELECT cities.*, countries.name AS country_name FROM cities LEFT JOIN countries ON cities.country_id = countries.id WHERE 1=1';
    const params = [];
    if (country_id) { params.push(country_id); query += ` AND cities.country_id = $${params.length}`; }
    query += ' ORDER BY cities.name ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkPermission('reference_data.manage'), async (req, res) => {
  try {
    const { name, country_id } = req.body;
    const result = await pool.query('INSERT INTO cities (name, country_id) VALUES ($1,$2) RETURNING *', [name, country_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkPermission('reference_data.manage'), async (req, res) => {
  try {
    const { name, country_id } = req.body;
    const result = await pool.query('UPDATE cities SET name=$1, country_id=$2 WHERE id=$3 RETURNING *', [name, country_id, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ville non trouvée' });
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cities WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ville non trouvée' });
    res.json({ message: 'Ville supprimée' });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
