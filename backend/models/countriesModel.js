const pool = require('../db');

exports.findAll = async() => {
    const result = await pool.query('SELECT * FROM countries ORDER BY name ASC');
    return result.rows;
};

exports.create = async(name, isoCode, region) => {
    const result = await pool.query('INSERT INTO countries (name, iso_code, region) VALUES ($1,$2,$3) RETURNING *', [name, isoCode, region]);
    return result.rows[0];
};

// Traduction

exports.findAllByLanguage = async (langCode = 'fr') => {
    const result = await pool.query(
        `SELECT countries.id,
                COALESCE(ct.name, countries.name) AS name
         FROM countries
         LEFT JOIN languages l ON l.code = $1
         LEFT JOIN country_translations ct
           ON ct.country_id = countries.id AND ct.language_id = l.id
         ORDER BY countries.name`,
        [langCode]
    );
    return result.rows;
};

// Récupérer toutes les traductions d'un pays 
exports.findTranslations = async (countryId) => {
    const result = await pool.query(
        `SELECT languages.code, country_translations.name
         FROM country_translations
         JOIN languages ON languages.id = country_translations.language_id
         WHERE country_translations.country_id = $1`,
        [countryId]
    );

    const out = {};
    result.rows.forEach((r) => {
        out[r.code] = { name: r.name };
    });
    return out;
};

// Créer/mettre à jour les traductions 
exports.upsertTranslations = async (countryId, translations) => {
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
                `INSERT INTO country_translations (country_id, language_id, name, updated_at)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT (country_id, language_id)
                 DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
                [countryId, languageId, data.name]
            );
        }

        await client.query('COMMIT');
        return exports.findTranslations(countryId);
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};