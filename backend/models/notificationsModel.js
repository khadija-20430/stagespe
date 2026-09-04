const pool = require('../db');

// ============================================================
// RÉCUPÉRER TOUTES LES NOTIFICATIONS D'UN UTILISATEUR
// ============================================================

exports.findAllByUser = async(userId, limit = 50, offset = 0) => {
    const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`, [userId, limit, offset]
    );
    return result.rows;
};

// ============================================================
// RÉCUPÉRER LE NOMBRE DE NOTIFICATIONS NON LUES
// ============================================================

exports.countUnreadByUser = async(userId) => {
    const result = await pool.query(
        `SELECT COUNT(*) as count 
         FROM notifications 
         WHERE user_id = $1 AND is_read = FALSE`, [userId]
    );
    return parseInt(result.rows[0].count);
};

// ============================================================
// RÉCUPÉRER LES NOTIFICATIONS NON LUES
// ============================================================

exports.findUnreadByUser = async(userId) => {
    const result = await pool.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 AND is_read = FALSE 
         ORDER BY created_at DESC`, [userId]
    );
    return result.rows;
};

// ============================================================
// MARQUER COMME LUE
// ============================================================

exports.markAsRead = async(id, userId) => {
    const result = await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]
    );
    return result.rows[0];
};

// ============================================================
// MARQUER TOUTES COMME LUES
// ============================================================

exports.markAllAsRead = async(userId) => {
    const result = await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE RETURNING *', [userId]
    );
    return result.rows;
};

// ============================================================
// CRÉER UNE NOTIFICATION - VERSION SIMPLIFIÉE
// ============================================================

exports.create = async(data) => {
    const { user_id, title, message, type, link } = data;

    // On laisse PostgreSQL gérer id, is_read (default false) et created_at (default now())
    const result = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`, [user_id, title, message, type || 'info', link || null]
    );
    return result.rows[0];
};

// ============================================================
// CRÉER POUR PLUSIEURS UTILISATEURS (VERSION SIMPLIFIÉE)
// ============================================================

exports.createForUsers = async(userIds, title, message, type = 'info', link = null) => {
    if (!userIds || userIds.length === 0) return [];

    const created = [];

    // Version simplifiée : boucle pour chaque utilisateur
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

// ============================================================
// SUPPRIMER UNE NOTIFICATION
// ============================================================

exports.delete = async(id, userId) => {
    const result = await pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]
    );
    return result.rows[0];
};

// ============================================================
// SUPPRIMER TOUTES LES NOTIFICATIONS D'UN UTILISATEUR
// ============================================================

exports.deleteAll = async(userId) => {
    const result = await pool.query(
        'DELETE FROM notifications WHERE user_id = $1 RETURNING *', [userId]
    );
    return result.rows;
};

// ============================================================
// RÉCUPÉRER LES ADMINISTRATEURS (tous, sans distinction de permissions)
// ============================================================

exports.getAdminUsers = async() => {
    const result = await pool.query(
        `SELECT id, full_name, email, role
         FROM users
         WHERE role IN ('super_admin', 'admin')
         AND is_active = TRUE`
    );
    return result.rows;
};

// ============================================================
// RÉCUPÉRER LES UTILISATEURS AYANT UNE PERMISSION DONNÉE
// (super_admin toujours inclus, même sans rôle personnalisé)
// ============================================================

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

// ============================================================
// SUPPRIMER LES NOTIFICATIONS ANCIENNES (30+ jours)
// ============================================================

exports.deleteOldNotifications = async(days = 30) => {
    const result = await pool.query(
        `DELETE FROM notifications
         WHERE created_at < NOW() - INTERVAL '${days} days'
         RETURNING *`
    );
    return result.rows;
};

module.exports = exports;