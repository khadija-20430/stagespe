const fs = require('fs');
const path = require('path');
const pool = require('../db');

function deleteOldFile(fileUrl) {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
    const filePath = path.join(__dirname, '..', fileUrl);
    fs.unlink(filePath, () => {});
}
exports.deleteOldFile = deleteOldFile;

// Remplace tous les livrables/résultats d'un projet par la nouvelle liste envoyée
// (tableau de strings). Si le tableau n'est pas fourni, on ne touche à rien.
async function replaceItems(client, table, projectId, items) {
    if (!Array.isArray(items)) return;
    await client.query(`DELETE FROM ${table} WHERE project_id = $1`, [projectId]);
    for (const description of items) {
        if (description && description.trim() !== '') {
            await client.query(`INSERT INTO ${table} (project_id, description) VALUES ($1,$2)`, [projectId, description]);
        }
    }
}

exports.findAllPublished = async(filters) => {
    const { status, programme_id, is_featured } = filters;
    let query = `
    SELECT projects.*, programmes.name AS programme_name, partners.name AS coordinator_partner_name
    FROM projects
    LEFT JOIN programmes ON projects.programme_id = programmes.id
    LEFT JOIN partners ON projects.coordinator_partner_id = partners.id
    WHERE projects.statut_publication = 'published'`;
    const params = [];
    if (status) { params.push(status);
        query += ` AND projects.status = $${params.length}`; }
    if (programme_id) { params.push(programme_id);
        query += ` AND projects.programme_id = $${params.length}`; }
    if (is_featured === 'true') query += ' AND projects.is_featured = TRUE';
    query += ' ORDER BY projects.id DESC';
    const result = await pool.query(query, params);
    return result.rows;
};

exports.findAllAdmin = async() => {
    const result = await pool.query(
        `SELECT projects.*, programmes.name AS programme_name FROM projects
     LEFT JOIN programmes ON projects.programme_id = programmes.id ORDER BY projects.id DESC`
    );
    return result.rows;
};

exports.findById = async(id) => {
    const result = await pool.query(
        `SELECT projects.*, programmes.name AS programme_name, partners.name AS coordinator_partner_name
     FROM projects
     LEFT JOIN programmes ON projects.programme_id = programmes.id
     LEFT JOIN partners ON projects.coordinator_partner_id = partners.id
     WHERE projects.id = $1`, [id]
    );
    return result.rows[0];
};

exports.findPartnersByProject = async(projectId) => {
    const result = await pool.query(
        `SELECT project_partners.*, partners.name AS partner_name FROM project_partners
     JOIN partners ON project_partners.partner_id = partners.id WHERE project_id = $1`, [projectId]
    );
    return result.rows;
};

exports.findDeliverablesByProject = async(projectId) => {
    const result = await pool.query('SELECT id, description FROM project_deliverables WHERE project_id = $1 ORDER BY id', [projectId]);
    return result.rows;
};

exports.findResultsByProject = async(projectId) => {
    const result = await pool.query('SELECT id, description FROM project_results WHERE project_id = $1 ORDER BY id', [projectId]);
    return result.rows;
};

exports.findNewsByProject = async(projectId) => {
    const result = await pool.query(
        "SELECT id, title, type, event_date, image_url FROM news_events WHERE project_id = $1 AND statut = 'published'", [projectId]
    );
    return result.rows;
};

exports.findDocumentsByProject = async(projectId) => {
    const result = await pool.query(
        `SELECT documents.id, documents.titre, documents.fichier_url FROM documents
     JOIN project_documents ON project_documents.document_id = documents.id
     WHERE project_documents.project_id = $1`, [projectId]
    );
    return result.rows;
};

exports.findLogoUrlById = async(id) => {
    const result = await pool.query('SELECT logo_url FROM projects WHERE id = $1', [id]);
    return result.rows[0];
};

exports.create = async(data, userId) => {
    const {
        title,
        acronym,
        reference_code,
        description,
        objectives,
        target_groups,
        official_website,
        status,
        programme_id,
        coordinator_partner_id,
        budget,
        start_date,
        end_date,
        is_featured,
        logo_url,
        deliverables,
        results
    } = data;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `INSERT INTO projects
       (title, acronym, reference_code, logo_url, description, objectives, target_groups,
        official_website, status, programme_id, coordinator_partner_id,
        coordinator_user_id, budget, start_date, end_date, is_featured, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`, [title, acronym, reference_code, logo_url, description, objectives, target_groups,
                official_website, status || 'proposed', programme_id, coordinator_partner_id,
                userId, budget, start_date, end_date, is_featured || false, userId
            ]
        );
        const project = result.rows[0];

        await replaceItems(client, 'project_deliverables', project.id, deliverables);
        await replaceItems(client, 'project_results', project.id, results);

        await client.query('COMMIT');
        return project;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.update = async(id, data, auditContext) => {
    const {
        title,
        acronym,
        reference_code,
        description,
        objectives,
        target_groups,
        official_website,
        status,
        programme_id,
        coordinator_partner_id,
        budget,
        start_date,
        end_date,
        is_featured,
        logo_url,
        deliverables,
        results
    } = data;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `SELECT set_config('app.current_user_id', $1, true), set_config('app.client_ip', $2, true)`, [String(auditContext.userId), auditContext.ip || '']
        );

        const result = await client.query(
            `UPDATE projects SET title=$1, acronym=$2, reference_code=$3, logo_url=$4, description=$5,
       objectives=$6, target_groups=$7, official_website=$8, status=$9, programme_id=$10,
       coordinator_partner_id=$11, budget=$12, start_date=$13, end_date=$14, is_featured=$15
       WHERE id=$16 RETURNING *`, [title, acronym, reference_code, logo_url, description, objectives, target_groups,
                official_website, status, programme_id, coordinator_partner_id, budget, start_date, end_date,
                is_featured, id
            ]
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        await replaceItems(client, 'project_deliverables', id, deliverables);
        await replaceItems(client, 'project_results', id, results);

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.publish = async(id) => {
    const result = await pool.query(
        `UPDATE projects SET statut_publication='published', published_at=NOW() WHERE id=$1 RETURNING *`, [id]
    );
    return result.rows[0];
};

exports.archive = async(id) => {
    const result = await pool.query(
        `UPDATE projects SET statut_publication='archived', archived_at=NOW() WHERE id=$1 RETURNING *`, [id]
    );
    return result.rows[0];
};

exports.duplicate = async(id, userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            `INSERT INTO projects
       (title, acronym, reference_code, logo_url, description, objectives, target_groups,
        official_website, status, programme_id, coordinator_partner_id,
        budget, start_date, end_date, statut_publication, created_by)
       SELECT title || ' (copie)', acronym, reference_code, logo_url, description, objectives,
              target_groups, official_website, status, programme_id,
              coordinator_partner_id, budget, start_date, end_date, 'draft', $2
       FROM projects WHERE id = $1 RETURNING *`, [id, userId]
        );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }
        const newProject = result.rows[0];

        await client.query(
            `INSERT INTO project_deliverables (project_id, description) SELECT $1, description FROM project_deliverables WHERE project_id = $2`, [newProject.id, id]
        );
        await client.query(
            `INSERT INTO project_results (project_id, description) SELECT $1, description FROM project_results WHERE project_id = $2`, [newProject.id, id]
        );

        await client.query('COMMIT');
        return newProject;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.remove = async(id) => {
    const result = await pool.query('DELETE FROM projects WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};