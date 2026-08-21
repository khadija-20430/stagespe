const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole, checkPermission } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { translateList, translateOne, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { type, project_id, is_featured } = req.query;
    let query = "SELECT * FROM news_events WHERE statut = 'published'";
    const params = [];
    if (type) { params.push(type); query += ` AND type = $${params.length}`; }
    if (project_id) { params.push(project_id); query += ` AND project_id = $${params.length}`; }
    if (is_featured === 'true') query += ' AND is_featured = TRUE';
    query += ' ORDER BY published_at DESC';
    const result = await pool.query(query, params);
    res.json(await translateList('news', result.rows, req.query.lang));
  } catch (err) { sendError(res, err); }
});

router.get('/admin/all', verifyToken, checkPermission('news_events.view'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news_events ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM news_events WHERE id = $1 AND statut = 'published'", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contenu non trouvé' });
    res.json(await translateOne('news', result.rows[0], req.query.lang));
  } catch (err) { sendError(res, err); }
});

router.get('/:id/translations', verifyToken, checkPermission('news_events.view'), async (req, res) => {
  try {
    res.json(await getAllTranslations('news', req.params.id));
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkPermission('news_events.create'), async (req, res) => {
  try {
    const {
      title, type, summary, description, project_id, event_date, end_date, location, image_url,
      is_featured, author_name, author_role, author_photo_url, quote_text, statut
    } = req.body;

    if (type === 'testimonial' && (!author_name || !quote_text)) {
      return res.status(400).json({ error: 'Un témoignage nécessite un auteur et une citation' });
    }

    const result = await pool.query(
      `INSERT INTO news_events
       (title, type, summary, description, project_id, event_date, end_date, location, image_url,
        is_featured, author_name, author_role, author_photo_url, quote_text, statut, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [title, type || 'news', summary, description, project_id, event_date, end_date, location, image_url,
       is_featured || false, author_name, author_role, author_photo_url, quote_text, statut || 'draft', req.user.id]
    );
    await logAction(req.user.id, 'create', 'news_event', result.rows[0].id, null, req);
    await upsertTranslations('news', result.rows[0].id, req.body.translations);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkPermission('news_events.edit'), async (req, res) => {
  try {
    const {
      title, type, summary, description, project_id, event_date, end_date, location, image_url,
      is_featured, author_name, author_role, author_photo_url, quote_text, statut
    } = req.body;

    if (type === 'testimonial' && (!author_name || !quote_text)) {
      return res.status(400).json({ error: 'Un témoignage nécessite un auteur et une citation' });
    }

    const publishedAtClause = statut === 'published' ? ', published_at = COALESCE(published_at, NOW())' : '';
    const result = await pool.query(
      `UPDATE news_events SET title=$1, type=$2, summary=$3, description=$4, project_id=$5, event_date=$6,
       end_date=$7, location=$8, image_url=$9, is_featured=$10, author_name=$11, author_role=$12,
       author_photo_url=$13, quote_text=$14, statut=$15, updated_at=NOW() ${publishedAtClause}
       WHERE id=$16 RETURNING *`,
      [title, type, summary, description, project_id, event_date, end_date, location, image_url,
       is_featured, author_name, author_role, author_photo_url, quote_text, statut, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contenu non trouvé' });
    await logAction(req.user.id, statut === 'published' ? 'publish' : 'update', 'news_event', req.params.id, null, req);
    await upsertTranslations('news', req.params.id, req.body.translations);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkPermission('news_events.delete'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM news_events WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contenu non trouvé' });
    await deleteTranslations('news', req.params.id);
    await logAction(req.user.id, 'delete', 'news_event', req.params.id, null, req);
    res.json({ message: 'Contenu supprimé', deleted: result.rows[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
