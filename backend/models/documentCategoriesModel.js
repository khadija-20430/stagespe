const pool = require('../db');

exports.findAll = async() => {
    const result = await pool.query('SELECT * FROM document_categories ORDER BY label ASC');
    return result.rows;
};

exports.create = async(code, label) => {
    const result = await pool.query('INSERT INTO document_categories (code, label) VALUES ($1,$2) RETURNING *', [code, label]);
    return result.rows[0];
};

exports.update = async(id, code, label) => {
    const result = await pool.query('UPDATE document_categories SET code=$1, label=$2 WHERE id=$3 RETURNING *', [code, label, id]);
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM document_categories WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};