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
    const { country_id, establishment_type, partnership_type, partnership_status, search } = req.query;
    let query = `
      SELECT partners.*, countries.name AS country_name
      FROM partners LEFT JOIN countries ON partners.country_id = countries.id
      WHERE partners.statut_publication = 'published'`;
    const params = [];
    if (country_id) { params.push(country_id); query += ` AND partners.country_id = $${params.length}`; }
    if (establishment_type) { params.push(establishment_type); query += ` AND partners.establishment_type = $${params.length}`; }
    if (partnership_type) { params.push(partnership_type); query += ` AND partners.partnership_type = $${params.length}`; }
    if (partnership_status) { params.push(partnership_status); query += ` AND partners.partnership_status = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND partners.name ILIKE $${params.length}`; }
    query += ' ORDER BY partners.id DESC';
    const result = await pool.query(query, params);
    res.json(await translateList('partner', result.rows, req.query.lang));
  } catch (err) { sendError(res, err); }
});

router.get('/map', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, latitude, longitude, country_id FROM partners
       WHERE statut_publication = 'published' AND latitude IS NOT NULL AND longitude IS NOT NULL`
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/admin/all', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT partners.*, countries.name AS country_name
       FROM partners LEFT JOIN countries ON partners.country_id = countries.id
       ORDER BY partners.id DESC`
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/:id', async (req, res) => {
  try {
    const partner = await pool.query(
      `SELECT partners.*, countries.name AS country_name
       FROM partners LEFT JOIN countries ON partners.country_id = countries.id
       WHERE partners.id = $1`,
      [req.params.id]
    );
    if (partner.rows.length === 0) return res.status(404).json({ error: 'Partenaire non trouvé' });

    const agreements = await pool.query('SELECT * FROM agreements WHERE partner_id = $1 ORDER BY start_date DESC', [req.params.id]);
    const contacts = await pool.query(
      'SELECT id, full_name, position, email, phone, is_primary FROM partner_contacts WHERE partner_id = $1 AND is_public = TRUE',
      [req.params.id]
    );
    const projects = await pool.query(
      `SELECT projects.id, projects.title, projects.status FROM project_partners
       JOIN projects ON project_partners.project_id = projects.id
       WHERE project_partners.partner_id = $1 AND projects.statut_publication = 'published'`,
      [req.params.id]
    );

    res.json({
      ...(await translateOne('partner', partner.rows[0], req.query.lang)),
      agreements: agreements.rows,
      contacts: contacts.rows,
      projects: projects.rows,
    });
  } catch (err) { sendError(res, err); }
});

router.get('/:id/translations', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    res.json(await getAllTranslations('partner', req.params.id));
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const {
      name, official_name, country_id, city, establishment_type, partnership_type, partnership_status,
      website, cooperation_areas, description, logo_url, latitude, longitude
    } = req.body;

    const result = await pool.query(
      `INSERT INTO partners
       (name, official_name, country_id, city, establishment_type, partnership_type, partnership_status,
        website, cooperation_areas, description, logo_url, latitude, longitude, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [name, official_name, country_id, city, establishment_type, partnership_type, partnership_status || 'active',
       website, cooperation_areas, description, logo_url, latitude, longitude, req.user.id]
    );
    await logAction(req.user.id, 'create', 'partner', result.rows[0].id, null, req);
    await upsertTranslations('partner', result.rows[0].id, req.body.translations);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const {
      name, official_name, country_id, city, establishment_type, partnership_type, partnership_status,
      website, cooperation_areas, description, logo_url, latitude, longitude
    } = req.body;

    const row = await withAuditContext(req.user.id, req.ip, async (client) => {
      const result = await client.query(
        `UPDATE partners SET name=$1, official_name=$2, country_id=$3, city=$4, establishment_type=$5,
         partnership_type=$6, partnership_status=$7, website=$8, cooperation_areas=$9, description=$10,
         logo_url=$11, latitude=$12, longitude=$13
         WHERE id=$14 RETURNING *`,
        [name, official_name, country_id, city, establishment_type, partnership_type, partnership_status,
         website, cooperation_areas, description, logo_url, latitude, longitude, req.params.id]
      );
      return result.rows[0];
    });

    if (!row) return res.status(404).json({ error: 'Partenaire non trouvé' });
    await upsertTranslations('partner', req.params.id, req.body.translations);
    res.json(row);
  } catch (err) { sendError(res, err); }
});

router.put('/:id/publish', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`UPDATE partners SET statut_publication='published', published_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partenaire non trouvé' });
    await logAction(req.user.id, 'publish', 'partner', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.put('/:id/archive', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`UPDATE partners SET statut_publication='archived', archived_at=NOW() WHERE id=$1 RETURNING *`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partenaire non trouvé' });
    await logAction(req.user.id, 'archive', 'partner', req.params.id, null, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.post('/:id/duplicate', verifyToken, checkRole('super_admin', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO partners
       (name, official_name, country_id, city, establishment_type, partnership_type, partnership_status,
        website, cooperation_areas, description, logo_url, latitude, longitude, statut_publication, created_by)
       SELECT name || ' (copie)', official_name, country_id, city, establishment_type, partnership_type,
              partnership_status, website, cooperation_areas, description, logo_url, latitude, longitude,
              'draft', $2
       FROM partners WHERE id = $1 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partenaire non trouvé' });
    await logAction(req.user.id, 'duplicate', 'partner', result.rows[0].id, { source_id: req.params.id }, req);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkRole('super_admin'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM partners WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partenaire non trouvé' });
    await deleteTranslations('partner', req.params.id);
    await logAction(req.user.id, 'delete', 'partner', req.params.id, null, req);
    res.json({ message: 'Partenaire supprimé', deleted: result.rows[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
