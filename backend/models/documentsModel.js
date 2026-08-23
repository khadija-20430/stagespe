const pool = require('../db');

const LINK_TABLES = {
    programme: { table: 'programme_documents', fk: 'programme_id' },
    project: { table: 'project_documents', fk: 'project_id' },
    call: { table: 'call_documents', fk: 'call_id' },
    agreement: { table: 'agreement_documents', fk: 'agreement_id' },
    mobility: { table: 'mobility_documents', fk: 'mobility_id' },
};
exports.LINK_TABLES = LINK_TABLES;

exports.findAllPublic = async(filters) => {
    const { categorie_id, programme_id, project_id, call_id, agreement_id, mobility_id, langage, search } = filters;
    let query = `
    SELECT DISTINCT documents.*, document_categories.code AS categorie_code, document_categories.label AS categorie_label
    FROM documents JOIN document_categories ON documents.categorie_id = document_categories.id`;
    const joins = [];
    const params = [];
    const conditions = ["documents.visibilite = 'public'"];

    const linkFilters = { programme: programme_id, project: project_id, call: call_id, agreement: agreement_id, mobility: mobility_id };
    for (const [entityType, value] of Object.entries(linkFilters)) {
        if (value) {
            const { table, fk } = LINK_TABLES[entityType];
            joins.push(`JOIN ${table} ON ${table}.document_id = documents.id`);
            params.push(value);
            conditions.push(`${table}.${fk} = $${params.length}`);
        }
    }
    if (categorie_id) { params.push(categorie_id);
        conditions.push(`documents.categorie_id = $${params.length}`); }
    if (langage) { params.push(langage);
        conditions.push(`documents.langage = $${params.length}`); }
    if (search) { params.push(`%${search}%`);
        conditions.push(`documents.titre ILIKE $${params.length}`); }

    query += ' ' + joins.join(' ') + ' WHERE ' + conditions.join(' AND ') + ' ORDER BY documents.date_upload DESC';
    const result = await pool.query(query, params);
    return result.rows;
};

exports.findAllAdmin = async() => {
    const result = await pool.query(
        `SELECT documents.*, document_categories.code AS categorie_code, document_categories.label AS categorie_label
     FROM documents JOIN document_categories ON documents.categorie_id = document_categories.id
     ORDER BY documents.date_upload DESC`
    );
    return result.rows;
};

exports.findExpired = async() => {
    const result = await pool.query('SELECT * FROM documents_expired');
    return result.rows;
};

exports.findById = async(id) => {
    const result = await pool.query(
        `SELECT documents.*, document_categories.code AS categorie_code, document_categories.label AS categorie_label
     FROM documents JOIN document_categories ON documents.categorie_id = document_categories.id
     WHERE documents.id = $1`, [id]
    );
    return result.rows[0];
};

exports.findLinksForDocument = async(id) => {
    const links = {};
    for (const [entityType, { table, fk }] of Object.entries(LINK_TABLES)) {
        const linkResult = await pool.query(`SELECT ${fk} FROM ${table} WHERE document_id = $1`, [id]);
        links[entityType] = linkResult.rows.map((r) => r[fk]);
    }
    return links;
};

exports.logAccess = async(documentId, userId, ip, userAgent, action) => {
    await pool.query(
        'INSERT INTO document_access_logs (document_id, user_id, ip_address, user_agent, action) VALUES ($1,$2,$3,$4,$5)', [documentId, userId, ip, userAgent, action]
    );
};

exports.findRevisions = async(id) => {
    const result = await pool.query(
        `SELECT document_revisions.*, users.full_name AS changed_by_name
     FROM document_revisions LEFT JOIN users ON document_revisions.changed_by = users.id
     WHERE document_id = $1 ORDER BY created_at DESC`, [id]
    );
    return result.rows;
};

exports.create = async(data) => {
    const { titre, description, fichier_url, categorie_id, langage, version, file_size, file_format, visibilite, is_featured, date_expiration, uploaded_by } = data;
    const result = await pool.query(
        `INSERT INTO documents (titre, description, fichier_url, categorie_id, langage, version, file_size, file_format, visibilite, is_featured, date_expiration, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`, [titre, description, fichier_url, categorie_id, langage || 'fr', version || '1.0', file_size, file_format,
            visibilite || 'public', is_featured || false, date_expiration, uploaded_by
        ]
    );
    return result.rows[0];
};

exports.createLink = async(entityType, documentId, entityId) => {
    const config = LINK_TABLES[entityType];
    if (!config) return null;
    await pool.query(
        `INSERT INTO ${config.table} (document_id, ${config.fk}) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [documentId, entityId]
    );
    return true;
};

exports.removeLink = async(entityType, documentId, entityId) => {
    const config = LINK_TABLES[entityType];
    if (!config) return null;
    await pool.query(`DELETE FROM ${config.table} WHERE document_id = $1 AND ${config.fk} = $2`, [documentId, entityId]);
    return true;
};

exports.getRevisionSourceInfo = async(id) => {
    const result = await pool.query('SELECT fichier_url, version, file_size FROM documents WHERE id = $1', [id]);
    return result.rows[0];
};

exports.createRevision = async(documentId, version, fichierUrl, fileSize, changedBy, changeNote) => {
    await pool.query(
        `INSERT INTO document_revisions (document_id, version, fichier_url, file_size, changed_by, change_note) VALUES ($1,$2,$3,$4,$5,$6)`, [documentId, version, fichierUrl, fileSize, changedBy, changeNote || null]
    );
};

exports.update = async(id, data) => {
    const { titre, description, fichier_url, categorie_id, langage, version, file_size, file_format, visibilite, is_featured, date_expiration } = data;
    const result = await pool.query(
        `UPDATE documents SET titre=$1, description=$2, fichier_url=$3, categorie_id=$4, langage=$5,
     version=$6, file_size=$7, file_format=$8, visibilite=$9, is_featured=$10, date_expiration=$11
     WHERE id=$12 RETURNING *`, [titre, description, fichier_url, categorie_id, langage, version, file_size, file_format, visibilite, is_featured, date_expiration, id]
    );
    return result.rows[0];
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM documents WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};