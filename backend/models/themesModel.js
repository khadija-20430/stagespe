const pool = require('../db');

exports.findAll = async() => {
    const result = await pool.query('SELECT * FROM themes ORDER BY name ASC');
    return result.rows;
};

exports.create = async(name) => {
    const result = await pool.query('INSERT INTO themes (name) VALUES ($1) RETURNING *', [name]);
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM themes WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};