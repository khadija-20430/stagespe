const pool = require('../db');

exports.findAll = async() => {
    const result = await pool.query('SELECT * FROM establishment_types ORDER BY label ASC');
    return result.rows;
};

exports.create = async(label) => {
    const result = await pool.query('INSERT INTO establishment_types (label) VALUES ($1) RETURNING *', [label]);
    return result.rows[0];
};

exports.update = async(id, label) => {
    const result = await pool.query('UPDATE establishment_types SET label=$1 WHERE id=$2 RETURNING *', [label, id]);
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM establishment_types WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};