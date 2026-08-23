const pool = require('../db');

exports.findPublicByPartner = async(partnerId) => {
    const result = await pool.query(
        'SELECT id, full_name, position, email, phone, is_primary FROM partner_contacts WHERE partner_id = $1 AND is_public = TRUE', [partnerId]
    );
    return result.rows;
};

exports.findAllByPartner = async(partnerId) => {
    const result = await pool.query('SELECT * FROM partner_contacts WHERE partner_id = $1', [partnerId]);
    return result.rows;
};

exports.create = async(data) => {
    const { partner_id, full_name, position, email, phone, is_primary, is_public, user_id } = data;
    const result = await pool.query(
        `INSERT INTO partner_contacts (partner_id, full_name, position, email, phone, is_primary, is_public, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [partner_id, full_name, position, email, phone, is_primary || false, is_public || false, user_id || null]
    );
    return result.rows[0];
};

exports.update = async(id, data) => {
    const { full_name, position, email, phone, is_primary, is_public, user_id } = data;
    const result = await pool.query(
        `UPDATE partner_contacts SET full_name=$1, position=$2, email=$3, phone=$4, is_primary=$5,
     is_public=$6, user_id=$7, updated_at=NOW() WHERE id=$8 RETURNING *`, [full_name, position, email, phone, is_primary, is_public, user_id || null, id]
    );
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM partner_contacts WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};