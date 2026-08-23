const pool = require('../db');

exports.findAll = async(filters) => {
    const { city_id, search } = filters;
    let query = `
    SELECT institutions.*, cities.name AS city_name, countries.name AS country_name, partners.name AS partner_name
    FROM institutions
    LEFT JOIN cities ON institutions.city_id = cities.id
    LEFT JOIN countries ON cities.country_id = countries.id
    LEFT JOIN partners ON institutions.partner_id = partners.id
    WHERE 1=1`;
    const params = [];
    if (city_id) { params.push(city_id);
        query += ` AND institutions.city_id = $${params.length}`; }
    if (search) { params.push(`%${search}%`);
        query += ` AND institutions.name ILIKE $${params.length}`; }
    query += ' ORDER BY institutions.name ASC';
    const result = await pool.query(query, params);
    return result.rows;
};

exports.create = async(name, cityId, partnerId) => {
    const result = await pool.query(
        'INSERT INTO institutions (name, city_id, partner_id) VALUES ($1,$2,$3) RETURNING *', [name, cityId, partnerId || null]
    );
    return result.rows[0];
};

exports.update = async(id, name, cityId, partnerId) => {
    const result = await pool.query(
        'UPDATE institutions SET name=$1, city_id=$2, partner_id=$3 WHERE id=$4 RETURNING *', [name, cityId, partnerId || null, id]
    );
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM institutions WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};