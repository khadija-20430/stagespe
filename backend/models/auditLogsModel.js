const pool = require('../db');

exports.findAll = async(filters) => {
    const { table_name, user_id, action } = filters;
    let query = `SELECT audit_logs.*, users.full_name AS user_name FROM audit_logs LEFT JOIN users ON audit_logs.user_id = users.id WHERE 1=1`;
    const params = [];
    if (table_name) { params.push(table_name);
        query += ` AND audit_logs.table_name = $${params.length}`; }
    if (user_id) { params.push(user_id);
        query += ` AND audit_logs.user_id = $${params.length}`; }
    if (action) { params.push(action);
        query += ` AND audit_logs.action = $${params.length}`; }
    query += ' ORDER BY audit_logs.created_at DESC LIMIT 300';
    const result = await pool.query(query, params);
    return result.rows;
};

exports.findDocumentAccess = async(documentId) => {
    const result = await pool.query(
        'SELECT * FROM document_access_logs WHERE document_id = $1 ORDER BY created_at DESC LIMIT 200', [documentId]
    );
    return result.rows;
};