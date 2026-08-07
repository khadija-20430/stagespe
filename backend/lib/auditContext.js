const pool = require('../db');

async function withAuditContext(userId, ip, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT set_config('app.current_user_id', $1, true), set_config('app.client_ip', $2, true)`,
      [userId ? String(userId) : '', ip || '']
    );
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { withAuditContext };
