const pool = require('../db');

exports.findAll = async() => {
    const result = await pool.query('SELECT * FROM permissions ORDER BY module, action');
    return result.rows;
};