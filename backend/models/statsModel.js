const pool = require('../db');

exports.findBasic = async() => {
    const result = await pool.query('SELECT * FROM dashboard_stats');
    return result.rows[0];
};

exports.findFull = async() => {
    const [basic, byCountry, expiring, closingSoon, byProgramme, expiredDocs] = await Promise.all([
        pool.query('SELECT * FROM dashboard_stats'),
        pool.query('SELECT * FROM partners_by_country'),
        pool.query('SELECT * FROM agreements_expiring_soon'),
        pool.query('SELECT * FROM calls_closing_soon'),
        pool.query('SELECT * FROM projects_by_programme'),
        pool.query('SELECT * FROM documents_expired'),
    ]);

    return {
        ...basic.rows[0],
        partners_by_country: byCountry.rows,
        agreements_expiring_soon: expiring.rows,
        calls_closing_soon: closingSoon.rows,
        projects_by_programme: byProgramme.rows,
        documents_expired: expiredDocs.rows,
    };
};