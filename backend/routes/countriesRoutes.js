const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM countries ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const { name, iso_code, region } = req.body;
    const result = await pool.query('INSERT INTO countries (name, iso_code, region) VALUES ($1,$2,$3) RETURNING *', [name, iso_code, region]);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

module.exports = router;
