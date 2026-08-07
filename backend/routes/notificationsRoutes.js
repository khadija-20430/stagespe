const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Notification non trouvée' });
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { user_id, title, message, type, link } = req.body;
    const result = await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [user_id, title, message, type || 'info', link]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

module.exports = router;
