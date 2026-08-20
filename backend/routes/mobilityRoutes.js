const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { translateList, translateOne, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

const router = express.Router();

// Remplace toutes les exigences de langue d'une offre par la nouvelle liste envoyée
// (tableau de { language_id, min_level }).
async function replaceLanguageRequirements(client, mobilityId, requirements) {
  if (!Array.isArray(requirements)) return;
  await client.query('DELETE FROM mobility_language_requirements WHERE mobility_id = $1', [mobilityId]);
  for (const req of requirements) {
    if (req && req.language_id) {
      await client.query(
        'INSERT INTO mobility_language_requirements (mobility_id, language_id, min_level) VALUES ($1,$2,$3)',
        [mobilityId, req.language_id, req.min_level || null]
      );
    }
  }
}

const MOBILITY_JOIN = `
  FROM mobility
  LEFT JOIN programmes ON mobility.programme_id = programmes.id
  LEFT JOIN countries ON mobility.destination_country_id = countries.id
  LEFT JOIN partners ON mobility.destination_partner_id = partners.id
  LEFT JOIN institutions ON mobility.institution_id = institutions.id
  LEFT JOIN cities ON institutions.city_id = cities.id
`;
const MOBILITY_SELECT = `
  SELECT mobility.*, programmes.name AS programme_name, countries.name AS country_name,
         partners.name AS partner_name, institutions.name AS institution_name, cities.name AS city_name
`;

router.get('/', async (req, res) => {
  try {
    const { type, status, programme_id, destination_country_id } = req.query;
    let query = `${MOBILITY_SELECT} ${MOBILITY_JOIN} WHERE mobility.statut_publication = 'published'`;
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
    const result = await pool.query(`${MOBILITY_SELECT} ${MOBILITY_JOIN} ORDER BY mobility.deadline ASC`);
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`${MOBILITY_SELECT} ${MOBILITY_JOIN} WHERE mobility.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Offre non trouvée' });

    const languages = await pool.query(
      `SELECT languages.id, languages.code, languages.name, mobility_language_requirements.min_level
       FROM mobility_language_requirements
       JOIN languages ON mobility_language_requirements.language_id = languages.id
       WHERE mobility_id = $1`,
      [req.params.id]
    );

    res.json({ ...(await translateOne('mobility', result.rows[0], req.query.lang)), language_requirements: languages.rows });
  } catch (err) { sendError(res, err); }
});

router.get('/:id/translations', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    res.json(await getAllTranslations('mobility', req.params.id));
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title, type, programme_id, project_id, agreement_id, destination_country_id, destination_partner_id,
      institution_id, target_audience, description, conditions, places_count, duration, period,
      funding_details, application_procedure, selection_criteria, application_link,
      contact_person, contact_email, deadline, start_date, end_date, status, language_requirements
    } = req.body;

    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO mobility
       (title, type, programme_id, project_id, agreement_id, destination_country_id, destination_partner_id,
        institution_id, target_audience, description, conditions, places_count, duration, period,
        funding_details, application_procedure, selection_criteria, application_link,
        contact_person, contact_email, deadline, start_date, end_date, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING *`,
      [title, type, programme_id, project_id, agreement_id, destination_country_id, destination_partner_id,
       institution_id, target_audience, description, conditions, places_count, duration, period,
       funding_details, application_procedure, selection_criteria, application_link,
       contact_person, contact_email, deadline, start_date, end_date, status || 'open', req.user.id]
    );
    const mobility = result.rows[0];

    await replaceLanguageRequirements(client, mobility.id, language_requirements);

    await client.query('COMMIT');
    await logAction(req.user.id, 'create', 'mobility', mobility.id, null, req);
    await upsertTranslations('mobility', mobility.id, req.body.translations);
    res.status(201).json(mobility);
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
});

router.put('/:id', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title, type, programme_id, project_id, agreement_id, destination_country_id, destination_partner_id,
      institution_id, target_audience, description, conditions, places_count, duration, period,
      funding_details, application_procedure, selection_criteria, application_link,
      contact_person, contact_email, deadline, start_date, end_date, status, language_requirements
    } = req.body;

    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE mobility SET title=$1, type=$2, programme_id=$3, project_id=$4, agreement_id=$5,
       destination_country_id=$6, destination_partner_id=$7, institution_id=$8, target_audience=$9,
       description=$10, conditions=$11, places_count=$12, duration=$13, period=$14,
       funding_details=$15, application_procedure=$16, selection_criteria=$17,
       application_link=$18, contact_person=$19, contact_email=$20, deadline=$21, start_date=$22,
       end_date=$23, status=$24, updated_at=NOW() WHERE id=$25 RETURNING *`,
      [title, type, programme_id, project_id, agreement_id, destination_country_id, destination_partner_id,
       institution_id, target_audience, description, conditions, places_count, duration, period,
       funding_details, application_procedure, selection_criteria, application_link,
       contact_person, contact_email, deadline, start_date, end_date, status, req.params.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    await replaceLanguageRequirements(client, req.params.id, language_requirements);

    await client.query('COMMIT');
    await logAction(req.user.id, 'update', 'mobility', req.params.id, null, req);
    await upsertTranslations('mobility', req.params.id, req.body.translations);
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    sendError(res, err);
  } finally {
    client.release();
  }
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

router.delete('/:id', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM mobility WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Offre non trouvée' });
    await deleteTranslations('mobility', req.params.id);
    await logAction(req.user.id, 'delete', 'mobility', req.params.id, null, req);
    res.json({ message: 'Offre supprimée', deleted: result.rows[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
