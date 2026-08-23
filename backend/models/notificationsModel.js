const pool = require('../db');

exports.findAllByUser = async(userId) => {
    const result = await pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]
    );
    return result.rows;
};

exports.markAsRead = async(id, userId) => {
    const result = await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]
    );
    return result.rows[0];
};

exports.markAllAsRead = async(userId) => {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
};

exports.create = async(data) => {
    const { user_id, title, message, type, link } = data;
    const result = await pool.query(
        'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1,$2,$3,$4,$5) RETURNING *', [user_id, title, message, type || 'info', link]
    );
    return result.rows[0];
};