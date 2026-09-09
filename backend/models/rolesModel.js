const pool = require('../db');

exports.findAllWithUserCount = async() => {
    const result = await pool.query(
        `SELECT roles.*, COUNT(users.id) AS users_count
     FROM roles LEFT JOIN users ON users.role_id = roles.id
     GROUP BY roles.id ORDER BY roles.id ASC`
    );
    return result.rows;
};

exports.findById = async(id) => {
    const result = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    return result.rows[0];
};

exports.findPermissionsByRole = async(roleId) => {
    const result = await pool.query(
        `SELECT permissions.* FROM permissions
     JOIN role_permissions ON role_permissions.permission_id = permissions.id
     WHERE role_permissions.role_id = $1
     ORDER BY permissions.module, permissions.action`, [roleId]
    );
    return result.rows;
};

exports.findIsSystemById = async(id) => {
    const result = await pool.query('SELECT is_system FROM roles WHERE id = $1', [id]);
    return result.rows[0];
};

exports.create = async(data, userId) => {
    const { name, description, permission_ids } = data;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const role = await client.query(
            'INSERT INTO roles (name, description, is_system, created_by) VALUES ($1,$2,FALSE,$3) RETURNING *', [name, description || null, userId]
        );

        if (Array.isArray(permission_ids) && permission_ids.length > 0) {
            const values = permission_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
            await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`, [role.rows[0].id, ...permission_ids]);
        }

        await client.query('COMMIT');
        return role.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.update = async(id, data) => {
    const { name, description } = data;
    const result = await pool.query('UPDATE roles SET name=$1, description=$2 WHERE id=$3 RETURNING *', [name, description, id]);
    return result.rows[0];
};

exports.replacePermissions = async(roleId, permissionIds) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
        if (permissionIds.length > 0) {
            const values = permissionIds.map((_, i) => `($1, $${i + 2})`).join(', ');
            await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`, [roleId, ...permissionIds]);
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.togglePermission = async(roleId, permissionId, enabled) => {
    if (enabled) {
        await pool.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [roleId, permissionId]
        );
    } else {
        await pool.query('DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2', [roleId, permissionId]);
    }
};

exports.unassignFromUsers = async(roleId) => {
    await pool.query('UPDATE users SET role_id = NULL WHERE role_id = $1', [roleId]);
};

exports.remove = async(id) => {
    await pool.query('DELETE FROM roles WHERE id=$1', [id]);
};