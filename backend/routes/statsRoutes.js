const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dashboard_stats');
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.get('/full', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const [basic, byCountry, expiring, closingSoon, byProgramme, expiredDocs] = await Promise.all([
      pool.query('SELECT * FROM dashboard_stats'),
      pool.query('SELECT * FROM partners_by_country'),
      pool.query('SELECT * FROM agreements_expiring_soon'),
      pool.query('SELECT * FROM calls_closing_soon'),
      pool.query('SELECT * FROM projects_by_programme'),
      pool.query('SELECT * FROM documents_expired'),
    ]);

    res.json({
      ...basic.rows[0],
      partners_by_country: byCountry.rows,
      agreements_expiring_soon: expiring.rows,
      calls_closing_soon: closingSoon.rows,
      projects_by_programme: byProgramme.rows,
      documents_expired: expiredDocs.rows,
    });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
