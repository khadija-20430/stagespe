const pool = require('../db');

// toutes les notifs d un utilisateur

exports.findAllByUser = async(userId, limit = 50, offset = 0) => {
    const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`, [userId, limit, offset]
    );
    return result.rows;
};

// nbr de notifs non lues

exports.countUnreadByUser = async(userId) => {
    const result = await pool.query(
        `SELECT COUNT(*) as count 
         FROM notifications 
         WHERE user_id = $1 AND is_read = FALSE`, [userId]
    );
    return parseInt(result.rows[0].count);
};

// recuperer les notifs non lues

exports.findUnreadByUser = async(userId) => {
    const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 AND is_read = FALSE 
         ORDER BY created_at DESC`, [userId]
    );
    return result.rows;
};

// marquer comme lu

exports.markAsRead = async(id, userId) => {
    const result = await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]
    );
    return result.rows[0];
};

// tout marquer comme lu

exports.markAllAsRead = async(userId) => {
    const result = await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE RETURNING *', [userId]
    );
    return result.rows;
};

// creer une notif pour un utilisateur

exports.create = async(data) => {
    const { user_id, title, message, type, link } = data;

    const result = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`, [user_id, title, message, type || 'info', link || null]
    );
    return result.rows[0];
};

//creer une notif groupé

exports.createForUsers = async(userIds, title, message, type = 'info', link = null) => {
    if (!userIds || userIds.length === 0) return [];

    const created = [];
    for (const userId of userIds) {
        const notif = await exports.create({
            user_id: userId,
            title,
            message,
            type,
            link
        });
        created.push(notif);
    }
    return created;
};

// supprimer une notif d un utilisateur

exports.delete = async(id, userId) => {
    const result = await pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]
    );
    return result.rows[0];
};

// supprimer toutes les notifs d un utilisateur

exports.deleteAll = async(userId) => {
    const result = await pool.query(
        'DELETE FROM notifications WHERE user_id = $1 RETURNING *', [userId]
    );
    return result.rows;
};


exports.getAdminUsers = async() => {
    const result = await pool.query(
        `SELECT id, full_name, email, role
         FROM users
         WHERE role IN ('super_admin', 'admin')
         AND is_active = TRUE`
    );
    return result.rows;
};


exports.getUsersWithPermission = async(permissionCode) => {
    const result = await pool.query(
        `SELECT DISTINCT u.id, u.full_name, u.email
         FROM users u
         LEFT JOIN role_permissions rp ON rp.role_id = u.role_id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         WHERE u.is_active = TRUE
           AND (u.role = 'super_admin' OR p.code = $1)`, [permissionCode]
    );
    return result.rows;
};

//supprimer les notifs plus anciennes
exports.deleteOldNotifications = async(days = 15) => {
    const result = await pool.query(
        `DELETE FROM notifications
         WHERE created_at < NOW() - INTERVAL '${days} days'
         RETURNING *`
    );
    return result.rows;
};

//milestone 
exports.wasMilestoneSent = async(entityType, entityId, milestone) => {
    const result = await pool.query(
        `SELECT id FROM notification_milestones 
         WHERE entity_type = $1 AND entity_id = $2 AND milestone = $3`,
        [entityType, entityId, milestone]
    );
    return result.rows.length > 0;
};

exports.markMilestoneSent = async(entityType, entityId, milestone) => {
    await pool.query(
        `INSERT INTO notification_milestones (entity_type, entity_id, milestone)
         VALUES ($1, $2, $3)
         ON CONFLICT (entity_type, entity_id, milestone) DO NOTHING`,
        [entityType, entityId, milestone]
    );
};

exports.findAll = async (limit = 100, offset = 0) => {
    const result = await pool.query(
        `SELECT n.*, u.full_name, u.email
         FROM notifications n
         LEFT JOIN users u ON n.user_id = u.id
         ORDER BY n.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    return result.rows;
};
module.exports = exports;