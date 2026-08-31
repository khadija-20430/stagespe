const fs = require('fs');
const path = require('path');
const pool = require('../db');


// =========================================================
// SUPPRIMER ANCIEN FICHIER
// =========================================================

function deleteOldFile(fileUrl) {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
        return;
    }

    const filePath = path.join(__dirname, '..', fileUrl);

    fs.unlink(filePath, () => {});
}

exports.deleteOldFile = deleteOldFile;


// =========================================================
// ACTUALITÉS / ÉVÉNEMENTS PUBLIÉS
// =========================================================

exports.findAllPublished = async (filters) => {
    const {
        type,
        project_id,
        is_featured
    } = filters;

    let query = `
        SELECT *
        FROM news_events
        WHERE statut_publication = 'published'
    `;

    const params = [];

    if (type) {
        params.push(type);

        query += `
            AND type = $${params.length}
        `;
    }

    if (project_id) {
        params.push(project_id);

        query += `
            AND project_id = $${params.length}
        `;
    }

    if (is_featured === 'true') {
        query += `
            AND is_featured = TRUE
        `;
    }

    query += `
        ORDER BY published_at DESC
    `;

    const result = await pool.query(
        query,
        params
    );

    return result.rows;
};


// =========================================================
// ACTUALITÉ PUBLIÉE PAR ID
// =========================================================

exports.findPublishedById = async (id) => {
    const result = await pool.query(
        `
        SELECT *
        FROM news_events
        WHERE id = $1
        AND statut_publication = 'published'
        `,
        [id]
    );

    return result.rows[0];
};


// =========================================================
// TOUTES LES ACTUALITÉS POUR ADMIN
// =========================================================

exports.findAllAdmin = async () => {
    const result = await pool.query(
        `
        SELECT *
        FROM news_events
        ORDER BY created_at DESC
        `
    );

    return result.rows;
};


// =========================================================
// FICHIERS D'UNE ACTUALITÉ
// =========================================================

exports.findFilesById = async (id) => {
    const result = await pool.query(
        `
        SELECT
            image_url,
            author_photo_url
        FROM news_events
        WHERE id = $1
        `,
        [id]
    );

    return result.rows[0];
};


// =========================================================
// CRÉER ACTUALITÉ
// =========================================================

exports.create = async (data, userId) => {
    const {
        title,
        type,
        summary,
        description,
        project_id,
        event_date,
        end_date,
        location,
        image_url,
        is_featured,
        author_name,
        author_role,
        author_photo_url,
        quote_text,
        statut_publication
    } = data;

    const result = await pool.query(
        `
        INSERT INTO news_events
        (
            title,
            type,
            summary,
            description,
            project_id,
            event_date,
            end_date,
            location,
            image_url,
            is_featured,
            author_name,
            author_role,
            author_photo_url,
            quote_text,
            statut_publication,
            created_by
        )
        VALUES
        (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16
        )
        RETURNING *
        `,
        [
            title,
            type || 'news',
            summary,
            description,
            project_id,
            event_date,
            end_date,
            location,
            image_url,
            is_featured || false,
            author_name,
            author_role,
            author_photo_url,
            quote_text,
            statut_publication || 'draft',
            userId
        ]
    );

    return result.rows[0];
};


// =========================================================
// MODIFIER ACTUALITÉ
// =========================================================

exports.update = async (id, data) => {
    const {
        title,
        type,
        summary,
        description,
        project_id,
        event_date,
        end_date,
        location,
        image_url,
        is_featured,
        author_name,
        author_role,
        author_photo_url,
        quote_text,
        statut_publication
    } = data;

    const publishedAtClause =
        statut_publication === 'published'
            ? `,
                published_at = COALESCE(
                    published_at,
                    NOW()
                )
              `
            : '';

    const result = await pool.query(
        `
        UPDATE news_events
        SET
            title = $1,
            type = $2,
            summary = $3,
            description = $4,
            project_id = $5,
            event_date = $6,
            end_date = $7,
            location = $8,
            image_url = $9,
            is_featured = $10,
            author_name = $11,
            author_role = $12,
            author_photo_url = $13,
            quote_text = $14,
            statut_publication = $15,
            updated_at = NOW()
            ${publishedAtClause}
        WHERE id = $16
        RETURNING *
        `,
        [
            title,
            type,
            summary,
            description,
            project_id,
            event_date,
            end_date,
            location,
            image_url,
            is_featured,
            author_name,
            author_role,
            author_photo_url,
            quote_text,
            statut_publication,
            id
        ]
    );

    return result.rows[0];
};


// =========================================================
// SUPPRIMER
// =========================================================

exports.remove = async (id) => {
    const result = await pool.query(
        `
        DELETE FROM news_events
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0];
};


// =========================================================
// PUBLIER
// =========================================================

exports.publish = async (id) => {
    const result = await pool.query(
        `
        UPDATE news_events
        SET
            statut_publication = 'published',
            published_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0];
};


// =========================================================
// ARCHIVER
// =========================================================

exports.archive = async (id) => {
    const result = await pool.query(
        `
        UPDATE news_events
        SET
            statut_publication = 'archived',
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0];
};


// =========================================================
// RESTAURER
// =========================================================

exports.restore = async (id) => {
    const result = await pool.query(
        `
        UPDATE news_events
        SET
            statut_publication = 'draft',
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );

    return result.rows[0];
};

