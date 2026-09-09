const pool = require('../db');

//authentification
exports.countRecentFailures = async(email, windowMinutes) => {
    const result = await pool.query(
        `SELECT COUNT(*) FROM login_history
         WHERE email_attempted = $1 AND success = FALSE
         AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'`, [email]
    );
    return parseInt(result.rows[0].count);
};

exports.findActiveUserByEmail = async(email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = TRUE', [email]);
    return result.rows[0];
};

exports.recordLoginAttempt = async(userId, email, success, ip, userAgent) => {
    await pool.query(
        'INSERT INTO login_history (user_id, email_attempted, success, ip_address, user_agent) VALUES ($1,$2,$3,$4,$5)', [userId, email, success, ip, userAgent]
    );
};

exports.findUserIdByEmail = async(email) => {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

exports.updateLastLogin = async(userId) => {
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);
};

// users
exports.findUserById = async(id) => {
    const query = 'SELECT id, full_name, email, role, role_id, is_active, created_at, last_login FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

exports.createUser = async({ full_name, email, password_hash, role, role_id }) => {
    const result = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, role_id)
         VALUES ($1,$2,$3,$4,$5) 
         RETURNING id, full_name, email, role, role_id, is_active, created_at`, 
        [full_name, email, password_hash, role || 'utilisateur', role === 'admin' ? (role_id || null) : null]
    );
    return result.rows[0];
};

exports.findAllUsers = async() => {
    const result = await pool.query(
        `SELECT users.id, users.full_name, users.email, users.role, users.role_id,
                roles.name AS role_name, users.is_active, users.last_login, users.created_at
         FROM users 
         LEFT JOIN roles ON users.role_id = roles.id
         ORDER BY users.id DESC`
    );
    return result.rows;
};

exports.updateUserProfile = async(id, { full_name, email }) => {
    const result = await pool.query(
        `UPDATE users SET
            full_name = COALESCE($1, full_name),
            email = COALESCE($2, email),
            updated_at = NOW()
         WHERE id = $3
         RETURNING id, full_name, email, role, role_id, is_active`, 
        [full_name || null, email || null, id]
    );
    return result.rows[0];
};

exports.setActiveStatus = async(id, isActive) => {
    const result = await pool.query(
        'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, is_active', 
        [isActive, id]
    );
    return result.rows[0];
};

exports.deleteUser = async(id) => {
    const result = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id, full_name, email', [id]
    );
    return result.rows[0];
};

//roles
exports.updateRole = async(id, role) => {
    const result = await pool.query(
        'UPDATE users SET role = $1, role_id = NULL, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, role, role_id', 
        [role, id]
    );
    return result.rows[0];
};

exports.findRoleOfUser = async(id) => {
    const result = await pool.query('SELECT role, role_id FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

exports.roleExists = async(roleId) => {
    const result = await pool.query('SELECT id FROM roles WHERE id = $1', [roleId]);
    return result.rows.length > 0;
};

exports.findRoleById = async(roleId) => {
    const result = await pool.query('SELECT id, name, description FROM roles WHERE id = $1', [roleId]);
    return result.rows[0];
};

exports.assignCustomRole = async(id, roleId) => {
    const result = await pool.query(
        `UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2
         RETURNING id, full_name, email, role, role_id`, 
        [roleId || null, id]
    );
    return result.rows[0];
};

// les permissions
exports.findAllPermissionCodes = async() => {
    const result = await pool.query('SELECT code FROM permissions');
    return result.rows.map((r) => r.code);
};

exports.findUserPermissionCodes = async(userId) => {
    const result = await pool.query(
        `SELECT permissions.code FROM permissions
         JOIN role_permissions ON role_permissions.permission_id = permissions.id
         JOIN users ON users.role_id = role_permissions.role_id
         WHERE users.id = $1`, 
        [userId]
    );
    return result.rows.map((r) => r.code);
};

// historique connexion
exports.findLoginHistory = async() => {
    const result = await pool.query(
        `SELECT login_history.*, users.full_name
         FROM login_history 
         LEFT JOIN users ON login_history.user_id = users.id
         ORDER BY login_history.created_at DESC LIMIT 200`
    );
    return result.rows;
};

// reenitialisation pw
exports.createResetToken = async(userId, token, expiresAt) => {
    const result = await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, user_id, token, expires_at, used, attempts, created_at`, 
        [userId, token, expiresAt]
    );
    return result.rows[0];
};

exports.createResetCode = async(userId, token, expiresAt) => {
    return exports.createResetToken(userId, token, expiresAt);
};

exports.findLatestValidResetCode = async(userId) => {
    const result = await pool.query(
        `SELECT * FROM password_reset_tokens
         WHERE user_id = $1 AND used = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`, 
        [userId]
    );
    return result.rows[0];
};

exports.incrementResetAttempts = async(resetTokenId) => {
    const result = await pool.query(
        `UPDATE password_reset_tokens
         SET attempts = attempts + 1
         WHERE id = $1
         RETURNING *`, 
        [resetTokenId]
    );
    return result.rows[0];
};

exports.updatePassword = async(userId, passwordHash) => {
    await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', 
        [passwordHash, userId]
    );
};

exports.markResetTokenUsed = async(tokenId) => {
    await pool.query(
        'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenId]
    );
};

exports.findValidResetToken = async(token) => {
    const result = await pool.query(
        `SELECT * FROM password_reset_tokens
         WHERE token = $1 AND used = FALSE AND expires_at > NOW()`, [token]
    );
    return result.rows[0];
};

// Recuperer tous les users
exports.findUsersByRoleId = async (roleId) => {
    const query = `
        SELECT id, full_name, email, role, role_id, is_active
        FROM users
        WHERE role_id = $1 AND is_active = true
        ORDER BY full_name
    `;
    const result = await pool.query(query, [roleId]);
    return result.rows;
};

// Recuperer tous les rôles RBAC 
exports.findAllRoles = async () => {
    const query = `
        SELECT id, name, description, created_at
        FROM roles
        ORDER BY name
    `;
    const result = await pool.query(query);
    return result.rows;
};

// Recuperer toutes les notifications d un utilisateur
exports.findNotificationsByUser = async(userId, limit = 50, offset = 0) => {
    const query = `
        SELECT * FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
};

// Recuperer les notifs non lues d un utilisateur
exports.findUnreadNotifications = async(userId) => {
    const query = `
        SELECT * FROM notifications
        WHERE user_id = $1 AND is_read = false
        ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

// nbr de notifs non lues
exports.countUnreadNotifications = async(userId) => {
    const query = `
        SELECT COUNT(*) FROM notifications
        WHERE user_id = $1 AND is_read = false
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
};

// Creer une notif
exports.createNotification = async({ user_id, title, message, type = 'info', link = null }) => {
    const query = `
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const result = await pool.query(query, [user_id, title, message, type, link]);
    return result.rows[0];
};

// Creer des notifs groupé
exports.createNotificationsForUsers = async(userIds, title, message, type = 'info', link = null) => {
    const notifications = [];
    for (const userId of userIds) {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, title, message, type, link]
        );
        notifications.push(result.rows[0]);
    }
    return notifications;
};

// Marquer une notif comme lue
exports.markNotificationAsRead = async(id, userId) => {
    const query = `
        UPDATE notifications
        SET is_read = true, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
};

// Marquer toutes les notifs comme lues
exports.markAllNotificationsAsRead = async(userId) => {
    const query = `
        UPDATE notifications
        SET is_read = true, updated_at = NOW()
        WHERE user_id = $1 AND is_read = false
        RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

// Supprimer une notif
exports.deleteNotification = async(id, userId) => {
    const query = `
        DELETE FROM notifications
        WHERE id = $1 AND user_id = $2
        RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
};

// Supprimer toutes les notifs d un utilisateur
exports.deleteAllNotifications = async(userId) => {
    const query = `
        DELETE FROM notifications
        WHERE user_id = $1
        RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

module.exports = exports;