const pool = require('../db');

exports.findAll = async(countryId) => {
    let query = 'SELECT cities.*, countries.name AS country_name FROM cities LEFT JOIN countries ON cities.country_id = countries.id WHERE 1=1';
    const params = [];
    if (countryId) { params.push(countryId);
        query += ` AND cities.country_id = $${params.length}`; }
    query += ' ORDER BY cities.name ASC';
    const result = await pool.query(query, params);
    return result.rows;
};

exports.create = async(name, countryId) => {
    const result = await pool.query('INSERT INTO cities (name, country_id) VALUES ($1,$2) RETURNING *', [name, countryId]);
    return result.rows[0];
};

exports.update = async(id, name, countryId) => {
    const result = await pool.query('UPDATE cities SET name=$1, country_id=$2 WHERE id=$3 RETURNING *', [name, countryId, id]);
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM cities WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};