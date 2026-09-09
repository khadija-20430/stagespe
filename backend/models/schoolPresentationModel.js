const pool = require('../db');

//toutes les presentations
exports.findAllAdmin = async() => {
    const result = await pool.query(
        `SELECT sp.*, 
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'id', spt.id,
                            'language_id', spt.language_id,
                            'language_code', l.code,
                            'titre', spt.titre,
                            'description', spt.description,
                            'fichier_url', spt.fichier_url,
                            'file_format', spt.file_format,
                            'file_size', spt.file_size,
                            'updated_at', spt.updated_at
                        )
                    ) FILTER (WHERE spt.id IS NOT NULL),
                    '[]'::json
                ) AS translations
         FROM school_presentation sp
         LEFT JOIN school_presentation_translation spt ON spt.school_presentation_id = sp.id
         LEFT JOIN languages l ON l.id = spt.language_id
         GROUP BY sp.id
         ORDER BY sp.created_at DESC`
    );
    return result.rows;
};

// toutes les presentations publié
exports.findAll = async() => {
    const result = await pool.query(
        `SELECT sp.*, 
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'id', spt.id,
                            'language_id', spt.language_id,
                            'language_code', l.code,
                            'titre', spt.titre,
                            'description', spt.description,
                            'fichier_url', spt.fichier_url,
                            'file_format', spt.file_format,
                            'file_size', spt.file_size,
                            'updated_at', spt.updated_at
                        )
                    ) FILTER (WHERE spt.id IS NOT NULL),
                    '[]'::json
                ) AS translations
         FROM school_presentation sp
         LEFT JOIN school_presentation_translation spt ON spt.school_presentation_id = sp.id
         LEFT JOIN languages l ON l.id = spt.language_id
         WHERE sp.visibilite = 'public'
         GROUP BY sp.id
         ORDER BY sp.created_at DESC`
    );
    return result.rows;
};

// 
exports.findById = async(id) => {
    const presentation = await pool.query(
        'SELECT * FROM school_presentation WHERE id = $1', [id]
    );
    if (!presentation.rows[0]) return null;

    const translations = await pool.query(
        `SELECT spt.*, l.code AS language_code, l.name AS language_name
         FROM school_presentation_translation spt
         JOIN languages l ON l.id = spt.language_id
         WHERE spt.school_presentation_id = $1
         ORDER BY l.code`, [id]
    );

    return {...presentation.rows[0], translations: translations.rows };
};

//
exports.findByLanguageCode = async(languageCode) => {
    const result = await pool.query(
        `SELECT spt.*, sp.visibilite, sp.created_at AS presentation_created_at
         FROM school_presentation_translation spt
         JOIN school_presentation sp ON sp.id = spt.school_presentation_id
         JOIN languages l ON l.id = spt.language_id
         WHERE l.code = $1 AND sp.visibilite = 'public'
         LIMIT 1`, [languageCode]
    );
    return result.rows[0];
};

//
exports.findTranslationById = async(translationId) => {
    const result = await pool.query(
        'SELECT * FROM school_presentation_translation WHERE id = $1', [translationId]
    );
    return result.rows[0];
};

//
exports.getRevisions = async(translationId) => {
    const result = await pool.query(
        `SELECT r.*, u.full_name AS replaced_by_name
         FROM school_presentation_revisions r
         LEFT JOIN users u ON u.id = r.replaced_by
         WHERE r.translation_id = $1
         ORDER BY r.replaced_at DESC`, [translationId]
    );
    return result.rows;
};

// creer presentation
exports.create = async(data) => {
    const { visibilite, created_by, translation } = data;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const presentation = await client.query(
            `INSERT INTO school_presentation (visibilite, created_by)
             VALUES ($1, $2) RETURNING *`, [visibilite || 'draft', created_by]
        );

        let createdTranslation = null;
        if (translation) {
            const { language_id, titre, description, fichier_url, file_format, file_size } = translation;
            const t = await client.query(
                `INSERT INTO school_presentation_translation
                    (school_presentation_id, language_id, titre, description, fichier_url, file_format, file_size)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [presentation.rows[0].id, language_id, titre, description, fichier_url, file_format, file_size]
            );
            createdTranslation = t.rows[0];
        }

        await client.query('COMMIT');
        return {...presentation.rows[0], translations: createdTranslation ? [createdTranslation] : [] };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ajouter traduction
exports.addTranslation = async(schoolPresentationId, data) => {
    const { language_id, titre, description, fichier_url, file_format, file_size } = data;
    const result = await pool.query(
        `INSERT INTO school_presentation_translation
            (school_presentation_id, language_id, titre, description, fichier_url, file_format, file_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [schoolPresentationId, language_id, titre, description, fichier_url, file_format, file_size]
    );
    return result.rows[0];
};

// mise a jour traduction
exports.updateTranslation = async(translationId, data) => {
    const fields = [];
    const params = [];
    let i = 1;

    if (data.titre !== undefined) { fields.push(`titre = $${i++}`);
        params.push(data.titre); }
    if (data.description !== undefined) { fields.push(`description = $${i++}`);
        params.push(data.description); }

    if (fields.length === 0) {
        return exports.findTranslationById(translationId);
    }

    params.push(translationId);
    const result = await pool.query(
        `UPDATE school_presentation_translation SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
        params
    );
    return result.rows[0];
};

// remplacer fichier
exports.replaceFile = async(translationId, newFile, userId) => {
    const { fichier_url, file_format, file_size } = newFile;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const current = await client.query(
            'SELECT * FROM school_presentation_translation WHERE id = $1 FOR UPDATE', [translationId]
        );
        if (!current.rows[0]) {
            await client.query('ROLLBACK');
            return null;
        }
        const old = current.rows[0];

        // Archive l ancien fichier
        await client.query(
            `INSERT INTO school_presentation_revisions
                (translation_id, fichier_url, file_format, file_size, replaced_by)
             VALUES ($1, $2, $3, $4, $5)`, [translationId, old.fichier_url, old.file_format, old.file_size, userId]
        );

        // ecrase avec le nouveau fichier
        const updated = await client.query(
            `UPDATE school_presentation_translation
             SET fichier_url = $1, file_format = $2, file_size = $3
             WHERE id = $4 RETURNING *`, [fichier_url, file_format, file_size, translationId]
        );

        await client.query('COMMIT');
        return updated.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// mise a jour visibilite
exports.updateVisibilite = async(id, visibilite) => {
    const result = await pool.query(
        'UPDATE school_presentation SET visibilite = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [visibilite, id]
    );
    return result.rows[0];
};

// publication
exports.publish = async(id) => {
    const result = await pool.query(
        `UPDATE school_presentation
         SET visibilite = 'public', updated_at = NOW()
         WHERE id = $1
         RETURNING *`, [id]
    );
    return result.rows[0];
};

//archiver
exports.archive = async(id) => {
    const result = await pool.query(
        `UPDATE school_presentation
         SET visibilite = 'draft', updated_at = NOW()
         WHERE id = $1
         RETURNING *`, [id]
    );
    return result.rows[0];
};

// suppression
exports.remove = async(id) => {
    const result = await pool.query(
        'DELETE FROM school_presentation WHERE id = $1 RETURNING *', [id]
    );
    return result.rows[0];
};

exports.removeTranslation = async(translationId) => {
    const result = await pool.query(
        'DELETE FROM school_presentation_translation WHERE id = $1 RETURNING *', [translationId]
    );
    return result.rows[0];
};

module.exports = exports;