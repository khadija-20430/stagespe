const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

// GET toutes les permissions disponibles, groupées par module — utile pour
// construire l'interface de gestion des rôles côté admin
router.get('/', verifyToken, checkPermission('manage_roles'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM permissions ORDER BY module, name');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

module.exports = router;
