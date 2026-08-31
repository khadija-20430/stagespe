const pool = require('../db');

const LINK_TABLES = {
    programme: { table: 'programme_documents', fk: 'programme_id' },
    project: { table: 'project_documents', fk: 'project_id' },
    call: { table: 'call_documents', fk: 'call_id' },
    agreement: { table: 'agreement_documents', fk: 'agreement_id' },
    mobility: { table: 'mobility_documents', fk: 'mobility_id' },
};

exports.LINK_TABLES = LINK_TABLES;


// =========================================================
// DOCUMENTS PUBLICS
// =========================================================

exports.findAllPublic = async(filters) => {
    const {
        categorie_id,
        programme_id,
        project_id,
        call_id,
        agreement_id,
        mobility_id,
        langage,
        search
    } = filters;

    let query = `
        SELECT DISTINCT
            documents.*,
            document_categories.code AS categorie_code,
            document_categories.label AS categorie_label
        FROM documents
        JOIN document_categories
            ON documents.categorie_id = document_categories.id
    `;

    const joins = [];
    const params = [];

    // IMPORTANT :
    // La colonne est statut_publication
    const conditions = [
        "documents.statut_publication = 'published'"
    ];

    const linkFilters = {
        programme: programme_id,
        project: project_id,
        call: call_id,
        agreement: agreement_id,
        mobility: mobility_id
    };

    for (const [entityType, value] of Object.entries(linkFilters)) {
        if (value) {
            const { table, fk } = LINK_TABLES[entityType];

            joins.push(`
                JOIN ${table}
                    ON ${table}.document_id = documents.id
            `);

            params.push(value);

            conditions.push(
                `${table}.${fk} = $${params.length}`
            );
        }
    }

    if (categorie_id) {
        params.push(categorie_id);

        conditions.push(
            `documents.categorie_id = $${params.length}`
        );
    }

    if (langage) {
        params.push(langage);

        conditions.push(
            `documents.langage = $${params.length}`
        );
    }

    if (search) {
        params.push(`%${search}%`);

        conditions.push(
            `documents.titre ILIKE $${params.length}`
        );
    }

    query +=
        joins.join(' ') +
        ' WHERE ' +
        conditions.join(' AND ') +
        ' ORDER BY documents.date_upload DESC';

    const result = await pool.query(query, params);

    return result.rows;
};


// =========================================================
// DOCUMENTS ADMIN
// =========================================================

exports.findAllAdmin = async() => {
    const result = await pool.query(`
        SELECT
            documents.*,
            document_categories.code AS categorie_code,
            document_categories.label AS categorie_label
        FROM documents
        JOIN document_categories
            ON documents.categorie_id = document_categories.id
        ORDER BY documents.date_upload DESC
    `);

    return result.rows;
};


// =========================================================
// DOCUMENTS EXPIRÉS
// =========================================================

exports.findExpired = async() => {
    const result = await pool.query(
        'SELECT * FROM documents_expired'
    );

    return result.rows;
};


// =========================================================
// DOCUMENT PAR ID
// =========================================================

exports.findById = async(id) => {
    const result = await pool.query(
        `
        SELECT
            documents.*,
            document_categories.code AS categorie_code,
            document_categories.label AS categorie_label
        FROM documents
        JOIN document_categories
            ON documents.categorie_id = document_categories.id
        WHERE documents.id = $1
        `, [id]
    );

    return result.rows[0];
};


// =========================================================
// LIENS D'UN DOCUMENT
// =========================================================

exports.findLinksForDocument = async(id) => {
    const links = {};

    for (const [
            entityType,
            { table, fk }
        ] of Object.entries(LINK_TABLES)) {

        const linkResult = await pool.query(
            `SELECT ${fk} FROM ${table} WHERE document_id = $1`, [id]
        );

        links[entityType] = linkResult.rows.map(
            (r) => r[fk]
        );
    }

    return links;
};


// =========================================================
// LOG ACCÈS DOCUMENT
// =========================================================

exports.logAccess = async(
    documentId,
    userId,
    ip,
    userAgent,
    action
) => {
    await pool.query(
        `
        INSERT INTO document_access_logs
        (
            document_id,
            user_id,
            ip_address,
            user_agent,
            action
        )
        VALUES ($1, $2, $3, $4, $5)
        `, [
            documentId,
            userId,
            ip,
            userAgent,
            action
        ]
    );
};


// =========================================================
// RÉVISIONS
// =========================================================

exports.findRevisions = async(id) => {
    const result = await pool.query(
        `
        SELECT
            document_revisions.*,
            users.full_name AS changed_by_name
        FROM document_revisions
        LEFT JOIN users
            ON document_revisions.changed_by = users.id
        WHERE document_id = $1
        ORDER BY created_at DESC
        `, [id]
    );

    return result.rows;
};


// =========================================================
// CRÉER DOCUMENT
// =========================================================

exports.update = async(id, data) => {
    try {
        const {
            titre,
            description,
            langage,
            version,
            statut_publication = 'draft',
            fichier_url,
            file_size,
            file_format,
            uploaded_by
        } = data;

        const query = `
            UPDATE documents 
            SET 
                titre = COALESCE($1, titre),
                description = COALESCE($2, description),
                langage = COALESCE($3, langage),
                version = COALESCE($4, version),
                statut_publication = COALESCE($5, statut_publication, 'draft'),
                fichier_url = COALESCE($6, fichier_url),
                file_size = COALESCE($7, file_size),
                file_format = COALESCE($8, file_format),
                uploaded_by = COALESCE($9, uploaded_by)
            WHERE id = $10
            RETURNING *
        `;
        const values = [
            titre,
            description,
            langage,
            version,
            statut_publication,
            fichier_url,
            file_size,
            file_format,
            uploaded_by,
            id
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Erreur update document:', error);
        throw error;
    }
};
exports.create = async(data) => {
    try {
        const {
            titre,
            description,
            langage,
            version = '1.0',
            statut_publication = 'draft',
            fichier_url,
            file_size,
            file_format,
            uploaded_by
        } = data;

        const query = `
            INSERT INTO documents (
                titre, description, langage, version, statut_publication,
                fichier_url, file_size, file_format, uploaded_by, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            RETURNING *
        `;
        const values = [
            titre,
            description,
            langage,
            version,
            statut_publication,
            fichier_url,
            file_size,
            file_format,
            uploaded_by
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Erreur create document:', error);
        throw error;
    }
};
// =========================================================
// CRÉER LIEN
// =========================================================

exports.createLink = async(
    entityType,
    documentId,
    entityId
) => {
    const config = LINK_TABLES[entityType];

    if (!config) return null;

    await pool.query(
        `
        INSERT INTO ${config.table}
        (
            document_id,
            ${config.fk}
        )
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `, [
            documentId,
            entityId
        ]
    );

    return true;
};


// =========================================================
// SUPPRIMER LIEN
// =========================================================

exports.removeLink = async(
    entityType,
    documentId,
    entityId
) => {
    const config = LINK_TABLES[entityType];

    if (!config) return null;

    await pool.query(
        `
        DELETE FROM ${config.table}
        WHERE document_id = $1
        AND ${config.fk} = $2
        `, [
            documentId,
            entityId
        ]
    );

    return true;
};


// =========================================================
// INFOS FICHIER POUR RÉVISION
// =========================================================

exports.getRevisionSourceInfo = async(id) => {
    const result = await pool.query(
        `
        SELECT
            fichier_url,
            version,
            file_size
        FROM documents
        WHERE id = $1
        `, [id]
    );

    return result.rows[0];
};


// =========================================================
// CRÉER RÉVISION
// =========================================================

exports.createRevision = async(
    documentId,
    version,
    fichierUrl,
    fileSize,
    changedBy,
    changeNote
) => {
    await pool.query(
        `
        INSERT INTO document_revisions
        (
            document_id,
            version,
            fichier_url,
            file_size,
            changed_by,
            change_note
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            documentId,
            version,
            fichierUrl,
            fileSize,
            changedBy,
            changeNote || null
        ]
    );
};


// =========================================================
// MODIFIER DOCUMENT
// =========================================================



// =========================================================
// SUPPRIMER
// =========================================================

exports.remove = async(id) => {
    const result = await pool.query(
        `
        DELETE FROM documents
        WHERE id = $1
        RETURNING *
        `, [id]
    );

    return result.rows[0];
};


// =========================================================
// PUBLIER
// =========================================================

exports.publish = async(id) => {
    const result = await pool.query(
        `
        UPDATE documents
        SET statut_publication = 'published'
        WHERE id = $1
        RETURNING *
        `, [id]
    );

    return result.rows[0];
};


// =========================================================
// ARCHIVER
// =========================================================

exports.archive = async(id) => {
    const result = await pool.query(
        `
        UPDATE documents
        SET statut_publication = 'archived'
        WHERE id = $1
        RETURNING *
        `, [id]
    );

    return result.rows[0];
};


// =========================================================
// RESTAURER
// =========================================================

exports.restore = async(id) => {
    const result = await pool.query(
        `
        UPDATE documents
        SET statut_publication = 'draft'
        WHERE id = $1
        RETURNING *
        `, [id]
    );

    return result.rows[0];
};