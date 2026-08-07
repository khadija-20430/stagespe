const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const { table_name, user_id, action } = req.query;
    let query = `SELECT audit_logs.*, users.full_name AS user_name FROM audit_logs LEFT JOIN users ON audit_logs.user_id = users.id WHERE 1=1`;
    const params = [];
    if (table_name) { params.push(table_name); query += ` AND audit_logs.table_name = $${params.length}`; }
    if (user_id) { params.push(user_id); query += ` AND audit_logs.user_id = $${params.length}`; }
    if (action) { params.push(action); query += ` AND audit_logs.action = $${params.length}`; }
    query += ' ORDER BY audit_logs.created_at DESC LIMIT 300';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/document-access/:documentId', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM document_access_logs WHERE document_id = $1 ORDER BY created_at DESC LIMIT 200', [req.params.documentId]);
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

module.exports = router;
