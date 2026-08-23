const fs = require('fs');
const path = require('path');
const pool = require('../db');

function deleteOldLogoFile(logoUrl) {
    if (!logoUrl || !logoUrl.startsWith('/uploads/')) return;
    const filePath = path.join(__dirname, '..', logoUrl);
    fs.unlink(filePath, () => {});
}
exports.deleteOldLogoFile = deleteOldLogoFile;

exports.findAll = async() => {
    const result = await pool.query('SELECT * FROM programmes ORDER BY name ASC');
    return result.rows;
};

exports.findById = async(id) => {
    const result = await pool.query('SELECT * FROM programmes WHERE id = $1', [id]);
    return result.rows[0];
};

exports.findLogoUrlById = async(id) => {
    const result = await pool.query('SELECT logo_url FROM programmes WHERE id = $1', [id]);
    return result.rows[0];
};

exports.create = async(data) => {
    const { name, acronym, organisme_financeur, description, official_website, logo_url } = data;
    const result = await pool.query(
        `INSERT INTO programmes (name, acronym, organisme_financeur, description, official_website, logo_url)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [name, acronym, organisme_financeur, description, official_website, logo_url]
    );
    return result.rows[0];
};

exports.update = async(id, data) => {
    const { name, acronym, organisme_financeur, description, official_website, logo_url } = data;
    const result = await pool.query(
        `UPDATE programmes SET name=$1, acronym=$2, organisme_financeur=$3, description=$4,
     official_website=$5, logo_url=$6 WHERE id=$7 RETURNING *`, [name, acronym, organisme_financeur, description, official_website, logo_url, id]
    );
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM programmes WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};