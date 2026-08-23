const pool = require('../db');

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

exports.updateLastLogin = async(userId) => {
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);
};

exports.createUser = async({ full_name, email, password_hash, role, role_id }) => {
    const result = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, role_id)
     VALUES ($1,$2,$3,$4,$5) RETURNING id, full_name, email, role, role_id, is_active, created_at`, [full_name, email, password_hash, role || 'utilisateur', role === 'admin' ? (role_id || null) : null]
    );
    return result.rows[0];
};

exports.findAllUsers = async() => {
    const result = await pool.query(
        `SELECT users.id, users.full_name, users.email, users.role, users.role_id,
            roles.name AS role_name, users.is_active, users.last_login, users.created_at
     FROM users LEFT JOIN roles ON users.role_id = roles.id
     ORDER BY users.id DESC`
    );
    return result.rows;
};

exports.setActiveStatus = async(id, isActive) => {
    const result = await pool.query(
        'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, is_active', [isActive, id]
    );
    return result.rows[0];
};

exports.updateRole = async(id, role) => {
    const result = await pool.query(
        'UPDATE users SET role = $1, role_id = NULL, updated_at = NOW() WHERE id = $2 RETURNING id, full_name, email, role, role_id', [role, id]
    );
    return result.rows[0];
};

exports.findRoleOfUser = async(id) => {
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

exports.roleExists = async(roleId) => {
    const result = await pool.query('SELECT id FROM roles WHERE id = $1', [roleId]);
    return result.rows.length > 0;
};

exports.assignCustomRole = async(id, roleId) => {
    const result = await pool.query(
        `UPDATE users SET role_id = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, full_name, email, role, role_id`, [roleId || null, id]
    );
    return result.rows[0];
};

exports.findAllPermissionCodes = async() => {
    const result = await pool.query('SELECT code FROM permissions');
    return result.rows.map((r) => r.code);
};

exports.findUserPermissionCodes = async(userId) => {
    const result = await pool.query(
        `SELECT permissions.code FROM permissions
     JOIN role_permissions ON role_permissions.permission_id = permissions.id
     JOIN users ON users.role_id = role_permissions.role_id
     WHERE users.id = $1`, [userId]
    );
    return result.rows.map((r) => r.code);
};

exports.findLoginHistory = async() => {
    const result = await pool.query(
        `SELECT login_history.*, users.full_name
     FROM login_history LEFT JOIN users ON login_history.user_id = users.id
     ORDER BY login_history.created_at DESC LIMIT 200`
    );
    return result.rows;
};

exports.findUserIdByEmail = async(email) => {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

exports.createResetToken = async(userId, token, expiresAt) => {
    await pool.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)', [userId, token, expiresAt]);
};

exports.findValidResetToken = async(token) => {
    const result = await pool.query(
        `SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()`, [token]
    );
    return result.rows[0];
};

exports.updatePassword = async(userId, passwordHash) => {
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);
};

exports.markResetTokenUsed = async(tokenId) => {
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [tokenId]);
};