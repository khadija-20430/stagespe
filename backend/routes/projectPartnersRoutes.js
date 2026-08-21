const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole, checkPermission } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/project/:projectId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT project_partners.*, partners.name AS partner_name, countries.name AS country_name
       FROM project_partners
       JOIN partners ON project_partners.partner_id = partners.id
       LEFT JOIN countries ON partners.country_id = countries.id
       WHERE project_id = $1`,
      [req.params.projectId]
    );
    res.json(result.rows);
  } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkPermission('projects.edit'), async (req, res) => {
  try {
    const { project_id, partner_id, role } = req.body;
    if (!role) return res.status(400).json({ error: 'Le rôle du partenaire dans le projet est requis' });
    const result = await pool.query(
      'INSERT INTO project_partners (project_id, partner_id, role) VALUES ($1,$2,$3) RETURNING *',
      [project_id, partner_id, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkPermission('projects.edit'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM project_partners WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Lien non trouvé' });
    res.json({ message: 'Lien supprimé' });
  } catch (err) { sendError(res, err); }
});

module.exports = router;
