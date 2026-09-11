// models/callsModel.js - Version corrigée avec traductions themes + countries

const pool = require('../db');

exports.findAllPublished = async(filters, lang = 'fr') => {
    const { programme_id, status, country_id, theme_id, action_type_id } = filters;
    let query = `
    SELECT calls.*, programmes.name AS programme_name, action_types.label AS action_type_label,
           COALESCE(
             (SELECT ARRAY_AGG(COALESCE(ctt.name, c.name))
              FROM call_countries cc
              JOIN countries c ON c.id = cc.country_id
              LEFT JOIN languages l2 ON l2.code = $1
              LEFT JOIN country_translations ctt
                ON ctt.country_id = c.id AND ctt.language_id = l2.id
              WHERE cc.call_id = calls.id),
             '{}'
           ) AS country_names,
           COALESCE(
             (SELECT ARRAY_AGG(COALESCE(tt.name, t.name))
              FROM call_themes ct
              JOIN themes t ON t.id = ct.theme_id
              LEFT JOIN languages l ON l.code = $1
              LEFT JOIN theme_translations tt
                ON tt.theme_id = t.id AND tt.language_id = l.id
              WHERE ct.call_id = calls.id),
             '{}'
           ) AS theme_names
    FROM calls
    LEFT JOIN programmes ON calls.programme_id = programmes.id
    LEFT JOIN action_types ON calls.action_type_id = action_types.id
    WHERE calls.statut_publication = 'published'`;

    // $1 est réservé à "lang" (utilisé dans les sous-selects thèmes ET pays ci-dessus).
    // Tous les filtres dynamiques doivent donc démarrer à $2.
    const params = [lang];

    if (programme_id) { params.push(programme_id);
        query += ` AND calls.programme_id = $${params.length}`; }
    if (status) { params.push(status);
        query += ` AND calls.status = $${params.length}`; }
    if (country_id) { params.push(country_id);
        query += ` AND EXISTS (SELECT 1 FROM call_countries WHERE call_countries.call_id = calls.id AND call_countries.country_id = $${params.length})`; }
    if (theme_id) { params.push(theme_id);
        query += ` AND EXISTS (SELECT 1 FROM call_themes WHERE call_themes.call_id = calls.id AND call_themes.theme_id = $${params.length})`; }
    if (action_type_id) { params.push(action_type_id);
        query += ` AND calls.action_type_id = $${params.length}`; }

    query += ' ORDER BY calls.deadline ASC';
    const result = await pool.query(query, params);
    return result.rows;
};

exports.findAllAdmin = async(lang = 'fr') => {
    const result = await pool.query(
        `SELECT calls.*, programmes.name AS programme_name, action_types.label AS action_type_label,
                COALESCE(
                    ARRAY_AGG(DISTINCT countries.id) FILTER (WHERE countries.id IS NOT NULL),
                    '{}'
                ) AS country_ids,
                COALESCE(
                    ARRAY_AGG(DISTINCT COALESCE(country_translations.name, countries.name))
                    FILTER (WHERE countries.id IS NOT NULL),
                    '{}'
                ) AS country_names,
                COALESCE(
                    ARRAY_AGG(DISTINCT themes.id) FILTER (WHERE themes.id IS NOT NULL),
                    '{}'
                ) AS theme_ids,
                COALESCE(
                    ARRAY_AGG(DISTINCT COALESCE(theme_translations.name, themes.name))
                    FILTER (WHERE themes.id IS NOT NULL),
                    '{}'
                ) AS theme_names
         FROM calls
         LEFT JOIN programmes ON calls.programme_id = programmes.id
         LEFT JOIN action_types ON calls.action_type_id = action_types.id
         LEFT JOIN call_countries ON call_countries.call_id = calls.id
         LEFT JOIN countries ON countries.id = call_countries.country_id
         LEFT JOIN call_themes ON call_themes.call_id = calls.id
         LEFT JOIN themes ON themes.id = call_themes.theme_id
         LEFT JOIN languages ON languages.code = $1
         LEFT JOIN theme_translations
           ON theme_translations.theme_id = themes.id
           AND theme_translations.language_id = languages.id
         LEFT JOIN country_translations
           ON country_translations.country_id = countries.id
           AND country_translations.language_id = languages.id
         GROUP BY calls.id, programmes.name, action_types.label
         ORDER BY calls.deadline ASC`,
        [lang]
    );
    return result.rows;
};

exports.findClosingSoon = async() => {
    const result = await pool.query('SELECT * FROM calls_closing_soon');
    return result.rows;
};

exports.findById = async(id) => {
    const call = await pool.query(
        `SELECT calls.*, programmes.name AS programme_name, action_types.label AS action_type_label
     FROM calls
     LEFT JOIN programmes ON calls.programme_id = programmes.id
     LEFT JOIN action_types ON calls.action_type_id = action_types.id
     WHERE calls.id = $1`, [id]
    );
    if (call.rows.length === 0) return null;

    const themes = await pool.query(
        `SELECT themes.* FROM themes JOIN call_themes ON call_themes.theme_id = themes.id WHERE call_themes.call_id = $1`, [id]
    );
    const countries = await pool.query(
        `SELECT countries.* FROM countries JOIN call_countries ON call_countries.country_id = countries.id WHERE call_countries.call_id = $1`, [id]
    );
    const documents = await pool.query(
        `SELECT documents.id, documents.titre, documents.fichier_url FROM documents
     JOIN call_documents ON call_documents.document_id = documents.id WHERE call_documents.call_id = $1`, [id]
    );

    return {...call.rows[0], themes: themes.rows, countries: countries.rows, documents: documents.rows };
};

exports.create = async(data, userId) => {
    const {
        title, programme_id, funding_body, description, objectives,
        eligibility, beneficiaries, action_type_id, budget_available,
        funding_rate, target_audience, publication_date, deadline,
        official_link, contact_person, theme_ids, country_ids,
        scheduled_publish_at  
    } = data;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
        `INSERT INTO calls
         (title, programme_id, funding_body, description, objectives, eligibility, beneficiaries,
          action_type_id, budget_available, funding_rate, target_audience,
          publication_date, deadline, official_link, contact_person, 
          scheduled_publish_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) 
         RETURNING *`, 
        [title, programme_id, funding_body, description, objectives, eligibility, beneficiaries,
         action_type_id, budget_available, funding_rate, target_audience,
         publication_date, deadline, official_link, contact_person,
         scheduled_publish_at || null,  // ← AJOUT
         userId]
    );
        const call = result.rows[0];

        if (Array.isArray(theme_ids) && theme_ids.length > 0) {
            const values = theme_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
            await client.query(`INSERT INTO call_themes (call_id, theme_id) VALUES ${values}`, [call.id, ...theme_ids]);
        }

        if (Array.isArray(country_ids) && country_ids.length > 0) {
            const values = country_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
            await client.query(`INSERT INTO call_countries (call_id, country_id) VALUES ${values}`, [call.id, ...country_ids]);
        }

        await client.query('COMMIT');
        return call;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.update = async(id, data, userId, ip) => {
    const {
        title,
        programme_id,
        funding_body,
        description,
        objectives,
        eligibility,
        beneficiaries,
        action_type_id,
        budget_available,
        funding_rate,
        target_audience,
        publication_date,
        deadline,
        official_link,
        contact_person,
        theme_ids,
        country_ids,
        scheduled_publish_at
    } = data;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `SELECT set_config('app.current_user_id', $1, true), set_config('app.client_ip', $2, true)`, [String(userId), ip || '']
        );

       const result = await client.query(
        `UPDATE calls 
         SET title=$1, programme_id=$2, funding_body=$3, description=$4, objectives=$5,
             eligibility=$6, beneficiaries=$7, action_type_id=$8, budget_available=$9,
             funding_rate=$10, target_audience=$11, publication_date=$12, deadline=$13, 
             official_link=$14, contact_person=$15,
             scheduled_publish_at=$16,
             updated_at=NOW() 
         WHERE id=$17 RETURNING *`, 
        [title, programme_id, funding_body, description, objectives, eligibility, beneficiaries,
         action_type_id, budget_available, funding_rate, target_audience,
         publication_date, deadline, official_link, contact_person,
         scheduled_publish_at || null, id]
    );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        if (Array.isArray(theme_ids)) {
            await client.query('DELETE FROM call_themes WHERE call_id = $1', [id]);
            if (theme_ids.length > 0) {
                const values = theme_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
                await client.query(`INSERT INTO call_themes (call_id, theme_id) VALUES ${values}`, [id, ...theme_ids]);
            }
        }

        if (Array.isArray(country_ids)) {
            await client.query('DELETE FROM call_countries WHERE call_id = $1', [id]);
            if (country_ids.length > 0) {
                const values = country_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
                await client.query(`INSERT INTO call_countries (call_id, country_id) VALUES ${values}`, [id, ...country_ids]);
            }
        }

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
exports.publishScheduledDue = async() => {
    const result = await pool.query(
        `UPDATE calls
         SET statut_publication='published', published_at=NOW(), scheduled_publish_at=NULL
         WHERE statut_publication='draft'
           AND scheduled_publish_at IS NOT NULL
           AND scheduled_publish_at <= NOW()
         RETURNING id, title`
    );
    return result.rows;
};
exports.publish = async(id) => {
    const result = await pool.query(
        `UPDATE calls 
         SET statut_publication='published', 
             published_at=NOW(),
             scheduled_publish_at=NULL
         WHERE id=$1 
         RETURNING *`, 
        [id]
    );
    return result.rows[0];
};

exports.archive = async(id) => {
    const result = await pool.query(`UPDATE calls SET statut_publication='archived', archived_at=NOW() WHERE id=$1 RETURNING *`, [id]);
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM calls WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};