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
    const { programme_id, status, country_id, theme_id, action_type_id } = req.query;
    let query = `
      SELECT DISTINCT calls.*, programmes.name AS programme_name, action_types.label AS action_type_label
      FROM calls
      LEFT JOIN programmes ON calls.programme_id = programmes.id
      LEFT JOIN action_types ON calls.action_type_id = action_types.id`;
    if (country_id) query += ' JOIN call_countries ON call_countries.call_id = calls.id';
    if (theme_id) query += ' JOIN call_themes ON call_themes.call_id = calls.id';
    query += " WHERE calls.statut_publication = 'published'";
    const params = [];
    if (programme_id) { params.push(programme_id); query += ` AND calls.programme_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND calls.status = $${params.length}`; }
    if (country_id) { params.push(country_id); query += ` AND call_countries.country_id = $${params.length}`; }
    if (theme_id) { params.push(theme_id); query += ` AND call_themes.theme_id = $${params.length}`; }
    if (action_type_id) { params.push(action_type_id); query += ` AND calls.action_type_id = $${params.length}`; }
    query += ' ORDER BY calls.deadline ASC';
    const result = await pool.query(query, params);
    res.json(await translateList('call', result.rows, req.query.lang));
  } catch (err) { sendError(res, err); }
});

router.get('/admin/all', verifyToken, checkPermission('calls.view'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT calls.*, programmes.name AS programme_name, action_types.label AS action_type_label
       FROM calls
       LEFT JOIN programmes ON calls.programme_id = programmes.id
       LEFT JOIN action_types ON calls.action_type_id = action_types.id
       ORDER BY calls.deadline ASC`
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/closing-soon', verifyToken, checkPermission('calls.view'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM calls_closing_soon');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/:id', async (req, res) => {
  try {
    const call = await pool.query(
      `SELECT calls.*, programmes.name AS programme_name, action_types.label AS action_type_label
       FROM calls
       LEFT JOIN programmes ON calls.programme_id = programmes.id
       LEFT JOIN action_types ON calls.action_type_id = action_types.id
       WHERE calls.id = $1`,
      [req.params.id]
    );
    if (call.rows.length === 0) return res.status(404).json({ error: 'Appel non trouvé' });

    const themes = await pool.query(
      `SELECT themes.* FROM themes JOIN call_themes ON call_themes.theme_id = themes.id WHERE call_themes.call_id = $1`,
      [req.params.id]
    );
    const countries = await pool.query(
      `SELECT countries.* FROM countries JOIN call_countries ON call_countries.country_id = countries.id WHERE call_countries.call_id = $1`,
      [req.params.id]
    );
    const documents = await pool.query(
      `SELECT documents.id, documents.titre, documents.fichier_url FROM documents
       JOIN call_documents ON call_documents.document_id = documents.id WHERE call_documents.call_id = $1`,
      [req.params.id]
    );

    res.json({ ...(await translateOne('call', call.rows[0], req.query.lang)), themes: themes.rows, countries: countries.rows, documents: documents.rows });
  } catch (err) { sendError(res, err); }
});

router.get('/:id/translations', verifyToken, checkPermission('calls.view'), async (req, res) => {
  try {
    res.json(await getAllTranslations('call', req.params.id));
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkPermission('calls.create'), async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title, programme_id, funding_body, description, objectives, eligibility, beneficiaries,
      action_type_id, budget_available, funding_rate, target_audience,
      publication_date, deadline, official_link, contact_person, status, theme_ids, country_ids
    } = req.body;

    if (publication_date && deadline && new Date(deadline) < new Date(publication_date)) {
      return res.status(400).json({ error: 'La deadline ne peut pas être antérieure à la date de publication' });
    }

    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO calls
       (title, programme_id, funding_body, description, objectives, eligibility, beneficiaries,
        action_type_id, budget_available, funding_rate, target_audience,
        publication_date, deadline, official_link, contact_person, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [title, programme_id, funding_body, description, objectives, eligibility, beneficiaries,
       action_type_id, budget_available, funding_rate, target_audience,
       publication_date, deadline, official_link, contact_person, status || 'open', req.user.id]
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
    await logAction(req.user.id, 'create', 'call', call.id, null, req);
    await upsertTranslations('call', call.id, req.body.translations);
    res.status(201).json(call);
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

router.put('/:id', verifyToken, checkPermission('calls.edit'), async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title, programme_id, funding_body, description, objectives, eligibility, beneficiaries,
      action_type_id, budget_available, funding_rate, target_audience,
      publication_date, deadline, official_link, contact_person, status, theme_ids, country_ids
    } = req.body;

    if (publication_date && deadline && new Date(deadline) < new Date(publication_date)) {
      return res.status(400).json({ error: 'La deadline ne peut pas être antérieure à la date de publication' });
    }

    await client.query('BEGIN');
    await client.query(
      `SELECT set_config('app.current_user_id', $1, true), set_config('app.client_ip', $2, true)`,
      [String(req.user.id), req.ip || '']
    );

    const result = await client.query(
      `UPDATE calls SET title=$1, programme_id=$2, funding_body=$3, description=$4, objectives=$5,
       eligibility=$6, beneficiaries=$7, action_type_id=$8, budget_available=$9,
       funding_rate=$10, target_audience=$11, publication_date=$12, deadline=$13, official_link=$14,
       contact_person=$15, status=$16, updated_at=NOW() WHERE id=$17 RETURNING *`,
      [title, programme_id, funding_body, description, objectives, eligibility, beneficiaries,
       action_type_id, budget_available, funding_rate, target_audience,
       publication_date, deadline, official_link, contact_person, status, req.params.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appel non trouvé' });
    }

    if (Array.isArray(theme_ids)) {
      await client.query('DELETE FROM call_themes WHERE call_id = $1', [req.params.id]);
      if (theme_ids.length > 0) {
        const values = theme_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(`INSERT INTO call_themes (call_id, theme_id) VALUES ${values}`, [req.params.id, ...theme_ids]);
      }
    }
    if (Array.isArray(country_ids)) {
      await client.query('DELETE FROM call_countries WHERE call_id = $1', [req.params.id]);
      if (country_ids.length > 0) {
        const values = country_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(`INSERT INTO call_countries (call_id, country_id) VALUES ${values}`, [req.params.id, ...country_ids]);
      }
    }

    await client.query('COMMIT');
    await upsertTranslations('call', req.params.id, req.body.translations);
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

router.put('/:id/publish', verifyToken, checkPermission('calls.publish'), async (req, res) => {
  try {
    const result = await pool.query(`UPDATE calls SET statut_publication='published', published_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appel non trouvé' });
    await logAction(req.user.id, 'publish', 'call', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id/archive', verifyToken, checkPermission('calls.publish'), async (req, res) => {
  try {
    const result = await pool.query(`UPDATE calls SET statut_publication='archived', archived_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appel non trouvé' });
    await logAction(req.user.id, 'archive', 'call', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkPermission('calls.delete'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM calls WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appel non trouvé' });
    await deleteTranslations('call', req.params.id);
    await logAction(req.user.id, 'delete', 'call', req.params.id, null, req);
    res.json({ message: 'Appel supprimé', deleted: result.rows[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
