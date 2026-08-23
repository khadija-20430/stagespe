const pool = require('../db');
const { withAuditContext } = require('../lib/auditContext');

exports.findAll = async(filters) => {
    const { partner_id, status } = filters;
    let query = `SELECT agreements.*, partners.name AS partner_name FROM agreements JOIN partners ON agreements.partner_id = partners.id WHERE 1=1`;
    const params = [];
    if (partner_id) { params.push(partner_id);
        query += ` AND agreements.partner_id = $${params.length}`; }
    if (status) { params.push(status);
        query += ` AND agreements.status = $${params.length}`; }
    query += ' ORDER BY agreements.start_date DESC';
    const result = await pool.query(query, params);
    return result.rows;
};

exports.findExpiringSoon = async() => {
    const result = await pool.query('SELECT * FROM agreements_expiring_soon');
    return result.rows;
};

exports.findById = async(id) => {
    const result = await pool.query('SELECT * FROM agreements WHERE id = $1', [id]);
    return result.rows[0];
};

exports.getFichierPdf = async(id) => {
    const result = await pool.query('SELECT fichier_pdf FROM agreements WHERE id = $1', [id]);
    return result.rows[0];
};

exports.create = async(data) => {
    const { partner_id, title, type, description, terms_conditions, fichier_pdf, signature_date, start_date, end_date, status, created_by } = data;
    const result = await pool.query(
        `INSERT INTO agreements (partner_id, title, type, description, terms_conditions, fichier_pdf, signature_date, start_date, end_date, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [partner_id, title, type, description, terms_conditions, fichier_pdf, signature_date, start_date, end_date, status || 'active', created_by]
    );
    return result.rows[0];
};

exports.update = async(id, data, userId, ip) => {
    const { partner_id, title, type, description, terms_conditions, fichier_pdf, signature_date, start_date, end_date, status } = data;
    return withAuditContext(userId, ip, async(client) => {
        const result = await client.query(
            `UPDATE agreements SET partner_id=$1, title=$2, type=$3, description=$4, terms_conditions=$5,
       fichier_pdf=$6, signature_date=$7, start_date=$8, end_date=$9, status=$10 WHERE id=$11 RETURNING *`, [partner_id, title, type, description, terms_conditions, fichier_pdf, signature_date, start_date, end_date, status, id]
        );
        return result.rows[0];
    });
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM agreements WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};