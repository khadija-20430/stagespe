const express = require('express');
const path = require('path');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole, checkPermission } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Chaque type d'entité correspond à sa propre table de jonction many-to-many
const LINK_TABLES = {
  programme: { table: 'programme_documents', fk: 'programme_id' },
  project: { table: 'project_documents', fk: 'project_id' },
  call: { table: 'call_documents', fk: 'call_id' },
  agreement: { table: 'agreement_documents', fk: 'agreement_id' },
  mobility: { table: 'mobility_documents', fk: 'mobility_id' },
};

router.post('/upload', verifyToken, checkPermission('documents.upload'), (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
    res.json({
      fichier_url: `/uploads/${req.file.filename}`,
      file_size: req.file.size,
      file_format: path.extname(req.file.originalname).replace('.', ''),
    });
  });
});

router.get('/', async (req, res) => {
  try {
    const { categorie_id, programme_id, project_id, call_id, agreement_id, mobility_id, langage, search } = req.query;
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
    if (categorie_id) { params.push(categorie_id); conditions.push(`documents.categorie_id = $${params.length}`); }
    if (langage) { params.push(langage); conditions.push(`documents.langage = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`documents.titre ILIKE $${params.length}`); }

    query += ' ' + joins.join(' ') + ' WHERE ' + conditions.join(' AND ') + ' ORDER BY documents.date_upload DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/admin/all', verifyToken, checkPermission('documents.view'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT documents.*, document_categories.code AS categorie_code, document_categories.label AS categorie_label
       FROM documents JOIN document_categories ON documents.categorie_id = document_categories.id
       ORDER BY documents.date_upload DESC`
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/expired', verifyToken, checkPermission('documents.view'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents_expired');
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT documents.*, document_categories.code AS categorie_code, document_categories.label AS categorie_label
       FROM documents JOIN document_categories ON documents.categorie_id = document_categories.id
       WHERE documents.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document non trouvé' });

    // Récupère tous les contenus liés à ce document (many-to-many)
    const links = {};
    for (const [entityType, { table, fk }] of Object.entries(LINK_TABLES)) {
      const linkResult = await pool.query(`SELECT ${fk} FROM ${table} WHERE document_id = $1`, [req.params.id]);
      links[entityType] = linkResult.rows.map((r) => r[fk]);
    }

    await pool.query(
      'INSERT INTO document_access_logs (document_id, user_id, ip_address, user_agent, action) VALUES ($1,$2,$3,$4,$5)',
      [req.params.id, null, req.ip, req.headers['user-agent'], 'view']
    );

    res.json({ ...result.rows[0], links });
  } catch (err) { sendError(res, err); }
});

router.get('/:id/download', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document non trouvé' });

    await pool.query(
      'INSERT INTO document_access_logs (document_id, user_id, ip_address, user_agent, action) VALUES ($1,$2,$3,$4,$5)',
      [req.params.id, null, req.ip, req.headers['user-agent'], 'download']
    );

    res.json({ fichier_url: result.rows[0].fichier_url });
  } catch (err) { sendError(res, err); }
});

router.get('/:id/revisions', verifyToken, checkPermission('documents.view'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT document_revisions.*, users.full_name AS changed_by_name
       FROM document_revisions LEFT JOIN users ON document_revisions.changed_by = users.id
       WHERE document_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

// POST — crée le document seul (les liens se font séparément via /:id/link)
router.post('/', verifyToken, checkPermission('documents.upload'), async (req, res) => {
  try {
    const { titre, description, fichier_url, categorie_id, langage, version, file_size, file_format, visibilite, is_featured, date_expiration } = req.body;

    const result = await pool.query(
      `INSERT INTO documents (titre, description, fichier_url, categorie_id, langage, version, file_size, file_format, visibilite, is_featured, date_expiration, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [titre, description, fichier_url, categorie_id, langage || 'fr', version || '1.0', file_size, file_format,
       visibilite || 'public', is_featured || false, date_expiration, req.user.id]
    );
    await logAction(req.user.id, 'create', 'document', result.rows[0].id, null, req);
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

// POST /:id/link — attache ce document à un contenu (plusieurs liens possibles)
router.post('/:id/link', verifyToken, checkPermission('documents.edit'), async (req, res) => {
  try {
    const { entity_type, entity_id } = req.body;
    const config = LINK_TABLES[entity_type];
    if (!config) return res.status(400).json({ error: 'entity_type invalide (programme, project, call, agreement, mobility)' });

    await pool.query(
      `INSERT INTO ${config.table} (document_id, ${config.fk}) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.params.id, entity_id]
    );
    res.status(201).json({ message: 'Lien créé' });
  } catch (err) { sendError(res, err); }
});

// DELETE /:id/link — détache ce document d'un contenu précis
router.delete('/:id/link', verifyToken, checkPermission('documents.edit'), async (req, res) => {
  try {
    const { entity_type, entity_id } = req.body;
    const config = LINK_TABLES[entity_type];
    if (!config) return res.status(400).json({ error: 'entity_type invalide' });

    await pool.query(`DELETE FROM ${config.table} WHERE document_id = $1 AND ${config.fk} = $2`, [req.params.id, entity_id]);
    res.json({ message: 'Lien supprimé' });
  } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkPermission('documents.edit'), async (req, res) => {
  try {
    const { titre, description, fichier_url, categorie_id, langage, version, file_size, file_format, visibilite, is_featured, date_expiration, change_note } = req.body;

    const existing = await pool.query('SELECT fichier_url, version, file_size FROM documents WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Document non trouvé' });

    if (fichier_url && fichier_url !== existing.rows[0].fichier_url) {
      await pool.query(
        `INSERT INTO document_revisions (document_id, version, fichier_url, file_size, changed_by, change_note) VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.params.id, existing.rows[0].version, existing.rows[0].fichier_url, existing.rows[0].file_size, req.user.id, change_note || null]
      );
    }

    const result = await pool.query(
      `UPDATE documents SET titre=$1, description=$2, fichier_url=$3, categorie_id=$4, langage=$5,
       version=$6, file_size=$7, file_format=$8, visibilite=$9, is_featured=$10, date_expiration=$11
       WHERE id=$12 RETURNING *`,
      [titre, description, fichier_url, categorie_id, langage, version, file_size, file_format, visibilite, is_featured, date_expiration, req.params.id]
    );
    await logAction(req.user.id, 'update', 'document', req.params.id, { new_version: version }, req);
    res.json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkPermission('documents.delete'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM documents WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document non trouvé' });
    await logAction(req.user.id, 'delete', 'document', req.params.id, null, req);
    res.json({ message: 'Document supprimé', deleted: result.rows[0] });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
