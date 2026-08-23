const fs = require('fs');
const path = require('path');
const agreementsModel = require('../models/agreementsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

function deleteOldFile(fileUrl) {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
    const filePath = path.join(__dirname, '..', fileUrl);
    fs.unlink(filePath, () => {});
}

exports.getAll = async(req, res) => {
    try {
        const agreements = await agreementsModel.findAll(req.query);
        res.json(agreements);
    } catch (err) { sendError(res, err); }
};

exports.getExpiringSoon = async(req, res) => {
    try {
        const agreements = await agreementsModel.findExpiringSoon();
        res.json(agreements);
    } catch (err) { sendError(res, err); }
};

exports.getById = async(req, res) => {
    try {
        const agreement = await agreementsModel.findById(req.params.id);
        if (!agreement) return res.status(404).json({ error: 'Accord non trouvé' });
        res.json(agreement);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const { start_date, end_date } = req.body;
        if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
        }

        const fichier_pdf = req.file ? `/uploads/${req.file.filename}` : null;
        const agreement = await agreementsModel.create({...req.body, fichier_pdf, created_by: req.user.id });

        await logAction(req.user.id, 'create', 'agreement', agreement.id, null, req);
        res.status(201).json(agreement);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const { start_date, end_date } = req.body;
        if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
        }

        let fichier_pdf = req.body.fichier_pdf || null;
        if (req.file) {
            const existing = await agreementsModel.getFichierPdf(req.params.id);
            if (existing) deleteOldFile(existing.fichier_pdf);
            fichier_pdf = `/uploads/${req.file.filename}`;
        }

        const agreement = await agreementsModel.update(req.params.id, {...req.body, fichier_pdf }, req.user.id, req.ip);
        if (!agreement) return res.status(404).json({ error: 'Accord non trouvé' });
        res.json(agreement);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const existing = await agreementsModel.getFichierPdf(req.params.id);
        const agreement = await agreementsModel.remove(req.params.id);
        if (!agreement) return res.status(404).json({ error: 'Accord non trouvé' });
        if (existing) deleteOldFile(existing.fichier_pdf);
        await logAction(req.user.id, 'delete', 'agreement', req.params.id, null, req);
        res.json({ message: 'Accord supprimé', deleted: agreement });
    } catch (err) { sendError(res, err); }
};