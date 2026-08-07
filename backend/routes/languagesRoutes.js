const express = require('express');
const pool = require('../db');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT code, name, is_default FROM languages WHERE is_active = TRUE ORDER BY is_default DESC, name ASC');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

module.exports = router;
