const express = require('express');
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM programmes ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) { sendError(res, err); }
});

router.get('/:id', async(req, res) => {
    try {
        const result = await pool.query('SELECT * FROM programmes WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Programme non trouvé' });
        res.json(result.rows[0]);
    } catch (err) { sendError(res, err); }
});

router.post('/', verifyToken, checkRole('super_admin', 'admin'), async(req, res) => {
    try {
        const { name, acronym, organisme_financeur, description, official_website, logo_url } = req.body;
        const result = await pool.query(
            `INSERT INTO programmes (name, acronym, organisme_financeur, description, official_website, logo_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [name, acronym, organisme_financeur, description, official_website, logo_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { sendError(res, err); }
});

router.put('/:id', verifyToken, checkRole('super_admin', 'admin'), async(req, res) => {
    try {
        const { name, acronym, organisme_financeur, description, official_website, logo_url } = req.body;
        const result = await pool.query(
            `UPDATE programmes SET name=$1, acronym=$2, organisme_financeur=$3, description=$4,
       official_website=$5, logo_url=$6 WHERE id=$7 RETURNING *`, [name, acronym, organisme_financeur, description, official_website, logo_url, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Programme non trouvé' });
        res.json(result.rows[0]);
    } catch (err) { sendError(res, err); }
});

router.delete('/:id', verifyToken, checkRole('super_admin', 'admin'), async(req, res) => {
    try {
        const result = await pool.query('DELETE FROM programmes WHERE id=$1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Programme non trouvé' });
        res.json({ message: 'Programme supprimé' });
    } catch (err) { sendError(res, err); }
});

module.exports = router;