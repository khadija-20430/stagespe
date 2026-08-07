const pool = require('../db');

async function logAction(userId, action, entityType, entityId, details = null, req = null) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, table_name, record_id, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        userId, action, entityType, entityId,
        details ? JSON.stringify(details) : null,
        entityType, entityId,
        req ? req.ip : null,
        req ? req.headers['user-agent'] : null,
      ]
    );
  } catch (err) {
    console.error('[AUDIT LOG] échec de journalisation :', err.message);
  }
}

module.exports = logAction;
