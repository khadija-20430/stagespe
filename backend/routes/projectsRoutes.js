const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole, checkPermission } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { withAuditContext } = require('../lib/auditContext');
const { translateList, translateOne, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

const router = express.Router();

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

router.get('/', async (req, res) => {
  try {
    const { status, programme_id, is_featured } = req.query;
    let query = `
      SELECT projects.*, programmes.name AS programme_name, partners.name AS coordinator_partner_name
      FROM projects
      LEFT JOIN programmes ON projects.programme_id = programmes.id
      LEFT JOIN partners ON projects.coordinator_partner_id = partners.id
      WHERE projects.statut_publication = 'published'`;
    const params = [];
    if (status) { params.push(status); query += ` AND projects.status = $${params.length}`; }
    if (programme_id) { params.push(programme_id); query += ` AND projects.programme_id = $${params.length}`; }
    if (is_featured === 'true') query += ' AND projects.is_featured = TRUE';
    query += ' ORDER BY projects.id DESC';
    const result = await pool.query(query, params);
    res.json(await translateList('project', result.rows, req.query.lang));
  } catch (err) { sendError(res, err); }
});

router.get('/admin/all', verifyToken, checkPermission('projects.view'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT projects.*, programmes.name AS programme_name FROM projects
       LEFT JOIN programmes ON projects.programme_id = programmes.id ORDER BY projects.id DESC`
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await pool.query(
      `SELECT projects.*, programmes.name AS programme_name, partners.name AS coordinator_partner_name
       FROM projects
       LEFT JOIN programmes ON projects.programme_id = programmes.id
       LEFT JOIN partners ON projects.coordinator_partner_id = partners.id
       WHERE projects.id = $1`,
      [req.params.id]
    );
    if (project.rows.length === 0) return res.status(404).json({ error: 'Projet non trouvé' });

    const partners = await pool.query(
      `SELECT project_partners.*, partners.name AS partner_name FROM project_partners
       JOIN partners ON project_partners.partner_id = partners.id WHERE project_id = $1`,
      [req.params.id]
    );
    const deliverables = await pool.query('SELECT id, description FROM project_deliverables WHERE project_id = $1 ORDER BY id', [req.params.id]);
    const results = await pool.query('SELECT id, description FROM project_results WHERE project_id = $1 ORDER BY id', [req.params.id]);
    const news = await pool.query(
      "SELECT id, title, type, event_date, image_url FROM news_events WHERE project_id = $1 AND statut = 'published'",
      [req.params.id]
    );
    const documents = await pool.query(
      `SELECT documents.id, documents.titre, documents.fichier_url FROM documents
       JOIN project_documents ON project_documents.document_id = documents.id
       WHERE project_documents.project_id = $1`,
      [req.params.id]
    );

    res.json({
      ...(await translateOne('project', project.rows[0], req.query.lang)),
      partners: partners.rows,
      deliverables: deliverables.rows,
      results: results.rows,
      news: news.rows,
      documents: documents.rows,
    });
  } catch (err) { sendError(res, err); }
});

router.get('/:id/translations', verifyToken, checkPermission('projects.view'), async (req, res) => {
  try {
    res.json(await getAllTranslations('project', req.params.id));
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkPermission('projects.create'), async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title, acronym, reference_code, logo_url, description, objectives, target_groups,
      official_website, status, programme_id, coordinator_partner_id, budget, start_date, end_date,
      is_featured, deliverables, results
    } = req.body;

    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
    }

    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO projects
       (title, acronym, reference_code, logo_url, description, objectives, target_groups,
        official_website, status, programme_id, coordinator_partner_id,
        coordinator_user_id, budget, start_date, end_date, is_featured, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [title, acronym, reference_code, logo_url, description, objectives, target_groups,
       official_website, status || 'proposed', programme_id, coordinator_partner_id,
       req.user.id, budget, start_date, end_date, is_featured || false, req.user.id]
    );
    const project = result.rows[0];

    await replaceItems(client, 'project_deliverables', project.id, deliverables);
    await replaceItems(client, 'project_results', project.id, results);

    await client.query('COMMIT');
    await logAction(req.user.id, 'create', 'project', project.id, null, req);
    await upsertTranslations('project', project.id, req.body.translations);
    res.status(201).json(project);
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

router.put('/:id', verifyToken, checkPermission('projects.edit'), async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title, acronym, reference_code, logo_url, description, objectives, target_groups,
      official_website, status, programme_id, coordinator_partner_id, budget, start_date, end_date,
      is_featured, deliverables, results
    } = req.body;

    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
    }

    await client.query('BEGIN');
    await client.query(
      `SELECT set_config('app.current_user_id', $1, true), set_config('app.client_ip', $2, true)`,
      [String(req.user.id), req.ip || '']
    );

    const result = await client.query(
      `UPDATE projects SET title=$1, acronym=$2, reference_code=$3, logo_url=$4, description=$5,
       objectives=$6, target_groups=$7, official_website=$8, status=$9, programme_id=$10,
       coordinator_partner_id=$11, budget=$12, start_date=$13, end_date=$14, is_featured=$15
       WHERE id=$16 RETURNING *`,
      [title, acronym, reference_code, logo_url, description, objectives, target_groups,
       official_website, status, programme_id, coordinator_partner_id, budget, start_date, end_date,
       is_featured, req.params.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    await replaceItems(client, 'project_deliverables', req.params.id, deliverables);
    await replaceItems(client, 'project_results', req.params.id, results);

    await client.query('COMMIT');
    await upsertTranslations('project', req.params.id, req.body.translations);
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

router.put('/:id/publish', verifyToken, checkPermission('projects.publish'), async (req, res) => {
  try {
    const result = await pool.query(`UPDATE projects SET statut_publication='published', published_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Projet non trouvé' });
    await logAction(req.user.id, 'publish', 'project', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id/archive', verifyToken, checkPermission('projects.publish'), async (req, res) => {
  try {
    const result = await pool.query(`UPDATE projects SET statut_publication='archived', archived_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Projet non trouvé' });
    await logAction(req.user.id, 'archive', 'project', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.post('/:id/duplicate', verifyToken, checkPermission('projects.create'), async (req, res) => {
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
       FROM projects WHERE id = $1 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Projet non trouvé' });
    }
    const newProject = result.rows[0];

    await client.query(
      `INSERT INTO project_deliverables (project_id, description) SELECT $1, description FROM project_deliverables WHERE project_id = $2`,
      [newProject.id, req.params.id]
    );
    await client.query(
      `INSERT INTO project_results (project_id, description) SELECT $1, description FROM project_results WHERE project_id = $2`,
      [newProject.id, req.params.id]
    );

    await client.query('COMMIT');
    await logAction(req.user.id, 'duplicate', 'project', newProject.id, { source_id: req.params.id }, req);
    res.status(201).json(newProject);
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

router.delete('/:id', verifyToken, checkPermission('projects.delete'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Projet non trouvé' });
    await deleteTranslations('project', req.params.id);
    await logAction(req.user.id, 'delete', 'project', req.params.id, null, req);
    res.json({ message: 'Projet supprimé', deleted: result.rows[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
