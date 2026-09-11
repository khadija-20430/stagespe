const fs = require('fs');
const path = require('path');
const pool = require('../db');
const { autoTranslateItems } = require('../lib/i18n');

function deleteOldFile(fileUrl) {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
    const filePath = path.join(__dirname, '..', fileUrl);
    fs.unlink(filePath, () => {});
}
exports.deleteOldFile = deleteOldFile;

async function replaceItems(client, table, translationTable, fkColumn, projectId, items) {
    if (!Array.isArray(items)) return;

    await client.query(`DELETE FROM ${table} WHERE project_id = $1`, [projectId]);

    for (const item of items) {
        if (!item) continue;

        const description = typeof item === 'string' ? item : item.description;
        if (!description || !description.trim()) continue;

        const result = await client.query(
            `INSERT INTO ${table} (project_id, description) VALUES ($1, $2) RETURNING id`,
            [projectId, description.trim()]
        );

        const newId = result.rows[0].id;

        if (item.translations && typeof item.translations === 'object') {
            for (const [langCode, translatedText] of Object.entries(item.translations)) {
                if (!translatedText || !translatedText.trim()) continue;

                const langRes = await client.query(
                    'SELECT id FROM languages WHERE code = $1',
                    [langCode]
                );
                if (langRes.rows.length === 0) continue;

                await client.query(
                    `INSERT INTO ${translationTable} (${fkColumn}, language_id, description)
                     VALUES ($1, $2, $3)`,
                    [newId, langRes.rows[0].id, translatedText.trim()]
                );
            }
        }
    }
}

// published
exports.findAllPublished = async (filters) => {
    const { status, programme_id, is_featured } = filters;
    let query = `
    SELECT projects.*, programmes.name AS programme_name, partners.name AS coordinator_partner_name,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', pd.id,
            'description', pd.description,
            'translations', COALESCE((
              SELECT json_object_agg(l.code, pdt.description)
              FROM project_deliverable_translations pdt
              JOIN languages l ON l.id = pdt.language_id
              WHERE pdt.deliverable_id = pd.id
            ), '{}'::json)
          ) ORDER BY pd.id
        )
        FROM project_deliverables pd
        WHERE pd.project_id = projects.id
      ), '[]') AS deliverables,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', pr.id,
            'description', pr.description,
            'translations', COALESCE((
              SELECT json_object_agg(l.code, prt.description)
              FROM project_result_translations prt
              JOIN languages l ON l.id = prt.language_id
              WHERE prt.result_id = pr.id
            ), '{}'::json)
          ) ORDER BY pr.id
        )
        FROM project_results pr
        WHERE pr.project_id = projects.id
      ), '[]') AS results,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', d.id,
            'titre', d.titre,
            'fichier_url', d.fichier_url,
            'file_format', d.file_format,
            'file_size', d.file_size
          ) ORDER BY d.id
        )
        FROM project_documents pdoc
        JOIN documents d ON d.id = pdoc.document_id
        WHERE pdoc.project_id = projects.id
          AND d.statut_publication = 'published'
      ), '[]') AS documents
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

// admin
exports.findAllAdmin = async () => {
    const result = await pool.query(`
        SELECT projects.*, programmes.name AS programme_name,
          COALESCE((
            SELECT json_agg(
              json_build_object(
                'id', pd.id,
                'description', pd.description,
                'translations', COALESCE((
                  SELECT json_object_agg(l.code, pdt.description)
                  FROM project_deliverable_translations pdt
                  JOIN languages l ON l.id = pdt.language_id
                  WHERE pdt.deliverable_id = pd.id
                ), '{}'::json)
              ) ORDER BY pd.id
            )
            FROM project_deliverables pd
            WHERE pd.project_id = projects.id
          ), '[]') AS deliverables,
          COALESCE((
            SELECT json_agg(
              json_build_object(
                'id', pr.id,
                'description', pr.description,
                'translations', COALESCE((
                  SELECT json_object_agg(l.code, prt.description)
                  FROM project_result_translations prt
                  JOIN languages l ON l.id = prt.language_id
                  WHERE prt.result_id = pr.id
                ), '{}'::json)
              ) ORDER BY pr.id
            )
            FROM project_results pr
            WHERE pr.project_id = projects.id
          ), '[]') AS results,
          COALESCE((
            SELECT json_agg(
              json_build_object(
                'id', d.id,
                'titre', d.titre,
                'fichier_url', d.fichier_url,
                'file_format', d.file_format,
                'file_size', d.file_size
              ) ORDER BY d.id
            )
            FROM project_documents pdoc
            JOIN documents d ON d.id = pdoc.document_id
            WHERE pdoc.project_id = projects.id
          ), '[]') AS documents
        FROM projects
        LEFT JOIN programmes ON projects.programme_id = programmes.id
        ORDER BY projects.id DESC
    `);
    return result.rows;
};

// find by id
exports.findById = async (id) => {
    const result = await pool.query(
        `SELECT projects.*, programmes.name AS programme_name, partners.name AS coordinator_partner_name
     FROM projects
     LEFT JOIN programmes ON projects.programme_id = programmes.id
     LEFT JOIN partners ON projects.coordinator_partner_id = partners.id
     WHERE projects.id = $1`, [id]
    );
    return result.rows[0];
};

// Partenaires d un projet
exports.findPartnersByProject = async (projectId) => {
    const result = await pool.query(
        `SELECT project_partners.*, partners.name AS partner_name FROM project_partners
     JOIN partners ON project_partners.partner_id = partners.id WHERE project_id = $1`, [projectId]
    );
    return result.rows;
};

// livrables d un projet (avec traductions)
exports.findDeliverablesByProject = async (projectId) => {
    const deliverables = await pool.query(
        'SELECT id, description FROM project_deliverables WHERE project_id = $1 ORDER BY id',
        [projectId]
    );

    const enriched = await Promise.all(
        deliverables.rows.map(async (d) => {
            const trs = await pool.query(
                `SELECT l.code, pdt.description
                 FROM project_deliverable_translations pdt
                 JOIN languages l ON l.id = pdt.language_id
                 WHERE pdt.deliverable_id = $1`,
                [d.id]
            );

            const translations = {};
            trs.rows.forEach((t) => {
                translations[t.code] = t.description;
            });

            return {
                id: d.id,
                description: d.description,
                translations,
            };
        })
    );

    return enriched;
};

// Resultats d un projet (avec traductions)
exports.findResultsByProject = async (projectId) => {
    const results = await pool.query(
        'SELECT id, description FROM project_results WHERE project_id = $1 ORDER BY id',
        [projectId]
    );

    const enriched = await Promise.all(
        results.rows.map(async (r) => {
            const trs = await pool.query(
                `SELECT l.code, prt.description
                 FROM project_result_translations prt
                 JOIN languages l ON l.id = prt.language_id
                 WHERE prt.result_id = $1`,
                [r.id]
            );

            const translations = {};
            trs.rows.forEach((t) => {
                translations[t.code] = t.description;
            });

            return {
                id: r.id,
                description: r.description,
                translations,
            };
        })
    );

    return enriched;
};


exports.findNewsByProject = async (projectId) => {
    const result = await pool.query(
        "SELECT id, title, type, event_date, image_url FROM news_events WHERE project_id = $1 AND statut_publication = 'published'", [projectId]
    );
    return result.rows;
};

exports.findDocumentsByProject = async (projectId) => {
    const result = await pool.query(
        `SELECT documents.id, documents.titre, documents.fichier_url FROM documents
     JOIN project_documents ON project_documents.document_id = documents.id
     WHERE project_documents.project_id = $1`, [projectId]
    );
    return result.rows;
};

exports.findLogoUrlById = async (id) => {
    const result = await pool.query('SELECT logo_url FROM projects WHERE id = $1', [id]);
    return result.rows[0];
};

// creation
exports.create = async (data, userId) => {
    const {
        title, acronym, reference_code, description, objectives, target_groups,
        official_website, status, programme_id, coordinator_partner_id,
        budget, start_date, end_date, is_featured, logo_url,
        deliverables, results, scheduled_publish_at
    } = data;

    const client = await pool.connect();
    let newDeliverables = [];
    let newResults = [];

    try {
        await client.query('BEGIN');
        const result = await client.query(
        `INSERT INTO projects
         (title, acronym, reference_code, logo_url, description, objectives, target_groups,
          official_website, status, programme_id, coordinator_partner_id,
          coordinator_user_id, budget, start_date, end_date, is_featured, 
          scheduled_publish_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) 
         RETURNING *`, 
        [title, acronym, reference_code, logo_url, description, objectives, target_groups,
         official_website, status || 'proposed', programme_id, coordinator_partner_id,
         userId, budget, start_date, end_date, is_featured || false,
         scheduled_publish_at || null,
         userId]
    );
        const project = result.rows[0];

        await replaceItems(
            client,
            'project_deliverables',
            'project_deliverable_translations',
            'deliverable_id',
            project.id,
            deliverables
        );
        await replaceItems(
            client,
            'project_results',
            'project_result_translations',
            'result_id',
            project.id,
            results
        );

        const dRows = await client.query(
            'SELECT id, description FROM project_deliverables WHERE project_id = $1',
            [project.id]
        );
        const rRows = await client.query(
            'SELECT id, description FROM project_results WHERE project_id = $1',
            [project.id]
        );
        newDeliverables = dRows.rows;
        newResults = rRows.rows;

        await client.query('COMMIT');

        if (newDeliverables.length > 0) {
            autoTranslateItems('project_deliverable', newDeliverables).catch((err) =>
                console.error('[I18N] autoTranslateItems deliverables:', err.message)
            );
        }
        if (newResults.length > 0) {
            autoTranslateItems('project_result', newResults).catch((err) =>
                console.error('[I18N] autoTranslateItems results:', err.message)
            );
        }

        return project;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Mise a jour
exports.update = async (id, data, auditContext) => {
    const {
        title, acronym, reference_code, description, objectives, target_groups,
        official_website, status, programme_id, coordinator_partner_id,
        budget, start_date, end_date, is_featured, logo_url,
        deliverables, results, scheduled_publish_at
    } = data;

    const client = await pool.connect();
    let newDeliverables = [];
    let newResults = [];

    try {
        await client.query('BEGIN');
        await client.query(
            `SELECT set_config('app.current_user_id', $1, true), set_config('app.client_ip', $2, true)`, [String(auditContext.userId), auditContext.ip || '']
        );

       const result = await client.query(
        `UPDATE projects SET title=$1, acronym=$2, reference_code=$3, logo_url=$4, 
         description=$5, objectives=$6, target_groups=$7, official_website=$8, 
         status=$9, programme_id=$10, coordinator_partner_id=$11, budget=$12, 
         start_date=$13, end_date=$14, is_featured=$15,
         scheduled_publish_at=$16
         WHERE id=$17 RETURNING *`, 
        [title, acronym, reference_code, logo_url, description, objectives, target_groups,
         official_website, status, programme_id, coordinator_partner_id, budget, start_date, end_date,
         is_featured, scheduled_publish_at || null, id]
    );
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }

        await replaceItems(
            client,
            'project_deliverables',
            'project_deliverable_translations',
            'deliverable_id',
            id,
            deliverables
        );
        await replaceItems(
            client,
            'project_results',
            'project_result_translations',
            'result_id',
            id,
            results
        );

        const dRows = await client.query(
            'SELECT id, description FROM project_deliverables WHERE project_id = $1',
            [id]
        );
        const rRows = await client.query(
            'SELECT id, description FROM project_results WHERE project_id = $1',
            [id]
        );
        newDeliverables = dRows.rows;
        newResults = rRows.rows;

        await client.query('COMMIT');

        if (newDeliverables.length > 0) {
            autoTranslateItems('project_deliverable', newDeliverables).catch((err) =>
                console.error('[I18N] autoTranslateItems deliverables:', err.message)
            );
        }
        if (newResults.length > 0) {
            autoTranslateItems('project_result', newResults).catch((err) =>
                console.error('[I18N] autoTranslateItems results:', err.message)
            );
        }

        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// publication
exports.publishScheduledDue = async () => {
    const result = await pool.query(
        `UPDATE projects
         SET statut_publication='published', published_at=NOW(), scheduled_publish_at=NULL
         WHERE statut_publication='draft'
           AND scheduled_publish_at IS NOT NULL
           AND scheduled_publish_at <= NOW()
         RETURNING id, title`
    );
    return result.rows;
};

exports.publish = async (id) => {
    const result = await pool.query(
        `UPDATE projects 
         SET statut_publication='published', 
             published_at=NOW(), 
             scheduled_publish_at=NULL
         WHERE id=$1 
         RETURNING *`, 
        [id]
    );
    return result.rows[0];
};

exports.archive = async (id) => {
    const result = await pool.query(
        `UPDATE projects SET statut_publication='archived', archived_at=NOW() WHERE id=$1 RETURNING *`, [id]
    );
    return result.rows[0];
};

// duplication
exports.duplicate = async (id, userId) => {
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

// supprimer
exports.remove = async (id) => {
    const result = await pool.query('DELETE FROM projects WHERE id=$1 RETURNING *', [id]);
    return result.rows[0];
};

// modifier traduction livrable
exports.replaceDeliverableTranslations = async (client, deliverableId, translations) => {
    await client.query(
        'DELETE FROM project_deliverable_translations WHERE deliverable_id = $1',
        [deliverableId]
    );

    for (const [langCode, description] of Object.entries(translations || {})) {
        if (!description || !description.trim()) continue;

        const langRes = await client.query(
            'SELECT id FROM languages WHERE code = $1',
            [langCode]
        );
        if (langRes.rows.length === 0) continue;

        await client.query(
            `INSERT INTO project_deliverable_translations
             (deliverable_id, language_id, description)
             VALUES ($1, $2, $3)`,
            [deliverableId, langRes.rows[0].id, description.trim()]
        );
    }
};

// modifier traduction resultat
exports.replaceResultTranslations = async (client, resultId, translations) => {
    await client.query(
        'DELETE FROM project_result_translations WHERE result_id = $1',
        [resultId]
    );

    for (const [langCode, description] of Object.entries(translations || {})) {
        if (!description || !description.trim()) continue;

        const langRes = await client.query(
            'SELECT id FROM languages WHERE code = $1',
            [langCode]
        );
        if (langRes.rows.length === 0) continue;

        await client.query(
            `INSERT INTO project_result_translations
             (result_id, language_id, description)
             VALUES ($1, $2, $3)`,
            [resultId, langRes.rows[0].id, description.trim()]
        );
    }
};

module.exports = exports;