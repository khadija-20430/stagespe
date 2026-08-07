const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { translateList, translateOne, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { type, status, programme_id, destination_country_id } = req.query;
    let query = `
      SELECT mobility.*, programmes.name AS programme_name, countries.name AS country_name, partners.name AS partner_name
      FROM mobility
      LEFT JOIN programmes ON mobility.programme_id = programmes.id
      LEFT JOIN countries ON mobility.destination_country_id = countries.id
      LEFT JOIN partners ON mobility.destination_partner_id = partners.id
      WHERE mobility.statut_publication = 'published'`;
    const params = [];
    if (type) { params.push(type); query += ` AND mobility.type = $${params.length}`; }
    if (status) { params.push(status); query += ` AND mobility.status = $${params.length}`; }
    if (programme_id) { params.push(programme_id); query += ` AND mobility.programme_id = $${params.length}`; }
    if (destination_country_id) { params.push(destination_country_id); query += ` AND mobility.destination_country_id = $${params.length}`; }
    query += ' ORDER BY mobility.deadline ASC';
    const result = await pool.query(query, params);
    res.json(await translateList('mobility', result.rows, req.query.lang));
  } catch (err) { sendError(res, err); }
});

router.get('/admin/all', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM mobility ORDER BY deadline ASC');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mobility.*, programmes.name AS programme_name, countries.name AS country_name, partners.name AS partner_name
       FROM mobility
       LEFT JOIN programmes ON mobility.programme_id = programmes.id
       LEFT JOIN countries ON mobility.destination_country_id = countries.id
       LEFT JOIN partners ON mobility.destination_partner_id = partners.id
       WHERE mobility.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Offre non trouvée' });
    res.json(await translateOne('mobility', result.rows[0], req.query.lang));
  } catch (err) { sendError(res, err); }
});

router.get('/:id/translations', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    res.json(await getAllTranslations('mobility', req.params.id));
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const {
      title, type, programme_id, project_id, agreement_id, destination_country_id, destination_partner_id,
      host_institution, host_city, target_audience, description, conditions, places_count, duration, period,
      language_requirements, funding_details, application_procedure, selection_criteria, application_link,
      contact_person, contact_email, deadline, start_date, end_date, status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO mobility
       (title, type, programme_id, project_id, agreement_id, destination_country_id, destination_partner_id,
        host_institution, host_city, target_audience, description, conditions, places_count, duration, period,
        language_requirements, funding_details, application_procedure, selection_criteria, application_link,
        contact_person, contact_email, deadline, start_date, end_date, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
       RETURNING *`,
      [title, type, programme_id, project_id, agreement_id, destination_country_id, destination_partner_id,
       host_institution, host_city, target_audience, description, conditions, places_count, duration, period,
       language_requirements, funding_details, application_procedure, selection_criteria, application_link,
       contact_person, contact_email, deadline, start_date, end_date, status || 'open', req.user.id]
    );
    await logAction(req.user.id, 'create', 'mobility', result.rows[0].id, null, req);
    await upsertTranslations('mobility', result.rows[0].id, req.body.translations);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const {
      title, type, programme_id, project_id, agreement_id, destination_country_id, destination_partner_id,
      host_institution, host_city, target_audience, description, conditions, places_count, duration, period,
      language_requirements, funding_details, application_procedure, selection_criteria, application_link,
      contact_person, contact_email, deadline, start_date, end_date, status
    } = req.body;

    const result = await pool.query(
      `UPDATE mobility SET title=$1, type=$2, programme_id=$3, project_id=$4, agreement_id=$5,
       destination_country_id=$6, destination_partner_id=$7, host_institution=$8, host_city=$9,
       target_audience=$10, description=$11, conditions=$12, places_count=$13, duration=$14, period=$15,
       language_requirements=$16, funding_details=$17, application_procedure=$18, selection_criteria=$19,
       application_link=$20, contact_person=$21, contact_email=$22, deadline=$23, start_date=$24,
       end_date=$25, status=$26, updated_at=NOW() WHERE id=$27 RETURNING *`,
      [title, type, programme_id, project_id, agreement_id, destination_country_id, destination_partner_id,
       host_institution, host_city, target_audience, description, conditions, places_count, duration, period,
       language_requirements, funding_details, application_procedure, selection_criteria, application_link,
       contact_person, contact_email, deadline, start_date, end_date, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Offre non trouvée' });
    await logAction(req.user.id, 'update', 'mobility', req.params.id, null, req);
    await upsertTranslations('mobility', req.params.id, req.body.translations);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id/publish', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`UPDATE mobility SET statut_publication='published', published_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Offre non trouvée' });
    await logAction(req.user.id, 'publish', 'mobility', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id/archive', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`UPDATE mobility SET statut_publication='archived', archived_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Offre non trouvée' });
    await logAction(req.user.id, 'archive', 'mobility', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM mobility WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Offre non trouvée' });
    await deleteTranslations('mobility', req.params.id);
    await logAction(req.user.id, 'delete', 'mobility', req.params.id, null, req);
    res.json({ message: 'Offre supprimée', deleted: result.rows[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
