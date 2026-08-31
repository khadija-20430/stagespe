const pool = require('../db');

// Valeurs de secours si la table est vide ou si une clé manque (ex: juste après
// la migration sur un environnement qui n'a pas encore ces lignes).
exports.DEFAULTS = {
    reset_code_window_minutes: '15',
    max_reset_attempts: '5',
    reset_email_subject: 'Votre code de réinitialisation de mot de passe',
    reset_email_text: 'Votre code de réinitialisation est : {{code}}. Ce code expire dans {{minutes}} minutes.',
};

exports.getAll = async() => {
    const result = await pool.query('SELECT key, value FROM app_settings');
    const map = {};
    result.rows.forEach((row) => { map[row.key] = row.value; });
    return {...exports.DEFAULTS, ...map };
};

// entries: [{ key, value }, ...]
exports.upsertMany = async(entries) => {
    const queries = entries.map(({ key, value }) =>
        pool.query(
            `INSERT INTO app_settings (key, value, updated_at) VALUES ($1,$2,NOW())
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`, [key, value]
        )
    );
    await Promise.all(queries);
};