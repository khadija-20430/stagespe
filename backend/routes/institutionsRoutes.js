const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { city_id, search } = req.query;
    let query = `
      SELECT institutions.*, cities.name AS city_name, countries.name AS country_name, partners.name AS partner_name
      FROM institutions
      LEFT JOIN cities ON institutions.city_id = cities.id
      LEFT JOIN countries ON cities.country_id = countries.id
      LEFT JOIN partners ON institutions.partner_id = partners.id
      WHERE 1=1`;
    const params = [];
    if (city_id) { params.push(city_id); query += ` AND institutions.city_id = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND institutions.name ILIKE $${params.length}`; }
    query += ' ORDER BY institutions.name ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { name, city_id, partner_id } = req.body;
    const result = await pool.query(
      'INSERT INTO institutions (name, city_id, partner_id) VALUES ($1,$2,$3) RETURNING *',
      [name, city_id, partner_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const { name, city_id, partner_id } = req.body;
    const result = await pool.query(
      'UPDATE institutions SET name=$1, city_id=$2, partner_id=$3 WHERE id=$4 RETURNING *',
      [name, city_id, partner_id || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Institution non trouvée' });
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM institutions WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Institution non trouvée' });
    res.json({ message: 'Institution supprimée' });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
