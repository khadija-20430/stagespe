const pool = require('../db');

exports.findAllByProject = async(projectId) => {
    const result = await pool.query(
        `SELECT project_partners.*, partners.name AS partner_name, countries.name AS country_name
     FROM project_partners
     JOIN partners ON project_partners.partner_id = partners.id
     LEFT JOIN countries ON partners.country_id = countries.id
     WHERE project_id = $1`, [projectId]
    );
    return result.rows;
};

exports.create = async(data) => {
    const { project_id, partner_id, role } = data;
    const result = await pool.query(
        'INSERT INTO project_partners (project_id, partner_id, role) VALUES ($1,$2,$3) RETURNING *', [project_id, partner_id, role]
    );
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM project_partners WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};