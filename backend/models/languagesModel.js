const pool = require('../db');

exports.findAllActive = async() => {
    const result = await pool.query(
        'SELECT code, name, is_default FROM languages WHERE is_active = TRUE ORDER BY is_default DESC, name ASC'
    );
    return result.rows;
};
// languagesModel.js — nouvelle fonction, on ne touche pas findAllActive
exports.findAllWithId = async () => {
    const result = await pool.query(
        'SELECT id, code, name, is_default FROM languages WHERE is_active = TRUE ORDER BY is_default DESC, name ASC'
    );
    return result.rows;
};