const pool = require('../db');

exports.findAll = async() => {
    const result = await pool.query('SELECT * FROM countries ORDER BY name ASC');
    return result.rows;
};

exports.create = async(name, isoCode, region) => {
    const result = await pool.query('INSERT INTO countries (name, iso_code, region) VALUES ($1,$2,$3) RETURNING *', [name, isoCode, region]);
    return result.rows[0];
};