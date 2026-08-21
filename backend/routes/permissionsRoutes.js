const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

// GET toutes les permissions, groupées par module — pour construire la grille
// de cases à cocher côté frontend (une ligne par module, une colonne par action)
router.get('/', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permissions ORDER BY module, action');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

module.exports = router;
