const pool = require('../db');

exports.findAll = async() => {
    const result = await pool.query('SELECT * FROM themes ORDER BY name ASC');
    return result.rows;
};

exports.create = async(name) => {
    const result = await pool.query('INSERT INTO themes (name) VALUES ($1) RETURNING *', [name]);
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM themes WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};

// Récupérer toutes les traductions d'un thème 
exports.findTranslations = async (themeId) => {
  const result = await pool.query(
    `SELECT languages.code, theme_translations.name
     FROM theme_translations
     JOIN languages ON languages.id = theme_translations.language_id
     WHERE theme_translations.theme_id = $1`,
    [themeId]
  );

 
  const out = {};
  result.rows.forEach((r) => {
    out[r.code] = { name: r.name };
  });
  return out;
};

exports.upsertTranslations = async (themeId, translations) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const [langCode, data] of Object.entries(translations)) {
      if (!data?.name) continue;

      const langRes = await client.query(
        'SELECT id FROM languages WHERE code = $1',
        [langCode]
      );
      if (langRes.rows.length === 0) continue;
      const languageId = langRes.rows[0].id;

      await client.query(
        `INSERT INTO theme_translations (theme_id, language_id, name, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (theme_id, language_id)
         DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
        [themeId, languageId, data.name]
      );
    }

    await client.query('COMMIT');
    return exports.findTranslations(themeId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Récupérer les thèmes dans une langue donnée 
exports.findAllByLanguage = async (langCode = 'fr') => {
  const result = await pool.query(
    `SELECT themes.id,
            COALESCE(tt.name, themes.name) AS name
     FROM themes
     LEFT JOIN languages l ON l.code = $1
     LEFT JOIN theme_translations tt
       ON tt.theme_id = themes.id AND tt.language_id = l.id
     ORDER BY themes.name`,
    [langCode]
  );
  return result.rows;
};