const pool = require('../db');

exports.findAll = async() => {
    const result = await pool.query('SELECT * FROM action_types ORDER BY label ASC');
    return result.rows;
};

exports.create = async(label) => {
    const result = await pool.query('INSERT INTO action_types (label) VALUES ($1) RETURNING *', [label]);
    return result.rows[0];
};

exports.update = async(id, label) => {
    const result = await pool.query('UPDATE action_types SET label=$1 WHERE id=$2 RETURNING *', [label, id]);
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM action_types WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};