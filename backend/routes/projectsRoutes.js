const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { withAuditContext } = require('../lib/auditContext');
const { translateList, translateOne, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

const router = express.Router();

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

router.get('/admin/all', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
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
      news: news.rows,
      documents: documents.rows,
    });
  } catch (err) { sendError(res, err); }
});

router.get('/:id/translations', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    res.json(await getAllTranslations('project', req.params.id));
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const {
      title, acronym, reference_code, logo_url, description, objectives, target_groups,
      results, deliverables, official_website, status, programme_id,
      coordinator_partner_id, budget, start_date, end_date, is_featured
    } = req.body;

    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
    }

    const result = await pool.query(
      `INSERT INTO projects
       (title, acronym, reference_code, logo_url, description, objectives, target_groups,
        results, deliverables, official_website, status, programme_id, coordinator_partner_id,
        coordinator_user_id, budget, start_date, end_date, is_featured, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [title, acronym, reference_code, logo_url, description, objectives, target_groups,
       results, deliverables, official_website, status || 'proposed', programme_id,
       coordinator_partner_id, req.user.id, budget, start_date, end_date, is_featured || false, req.user.id]
    );
    await logAction(req.user.id, 'create', 'project', result.rows[0].id, null, req);
    await upsertTranslations('project', result.rows[0].id, req.body.translations);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const {
      title, acronym, reference_code, logo_url, description, objectives, target_groups,
      results, deliverables, official_website, status, programme_id,
      coordinator_partner_id, budget, start_date, end_date, is_featured
    } = req.body;

    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
    }

    const row = await withAuditContext(req.user.id, req.ip, async (client) => {
      const result = await client.query(
        `UPDATE projects SET title=$1, acronym=$2, reference_code=$3, logo_url=$4, description=$5,
         objectives=$6, target_groups=$7, results=$8, deliverables=$9, official_website=$10,
         status=$11, programme_id=$12, coordinator_partner_id=$13, budget=$14, start_date=$15,
         end_date=$16, is_featured=$17 WHERE id=$18 RETURNING *`,
        [title, acronym, reference_code, logo_url, description, objectives, target_groups,
         results, deliverables, official_website, status, programme_id, coordinator_partner_id,
         budget, start_date, end_date, is_featured, req.params.id]
      );
      return result.rows[0];
    });

    if (!row) return res.status(404).json({ error: 'Projet non trouvé' });
    await upsertTranslations('project', req.params.id, req.body.translations);
    res.json(row);
  } catch (err) { sendError(res, err); }
});

router.put('/:id/publish', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`UPDATE projects SET statut_publication='published', published_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Projet non trouvé' });
    await logAction(req.user.id, 'publish', 'project', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id/archive', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`UPDATE projects SET statut_publication='archived', archived_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Projet non trouvé' });
    await logAction(req.user.id, 'archive', 'project', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.post('/:id/duplicate', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO projects
       (title, acronym, reference_code, logo_url, description, objectives, target_groups,
        results, deliverables, official_website, status, programme_id, coordinator_partner_id,
        budget, start_date, end_date, statut_publication, created_by)
       SELECT title || ' (copie)', acronym, reference_code, logo_url, description, objectives,
              target_groups, results, deliverables, official_website, status, programme_id,
              coordinator_partner_id, budget, start_date, end_date, 'draft', $2
       FROM projects WHERE id = $1 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Projet non trouvé' });
    await logAction(req.user.id, 'duplicate', 'project', result.rows[0].id, { source_id: req.params.id }, req);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Projet non trouvé' });
    await deleteTranslations('project', req.params.id);
    await logAction(req.user.id, 'delete', 'project', req.params.id, null, req);
    res.json({ message: 'Projet supprimé', deleted: result.rows[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
