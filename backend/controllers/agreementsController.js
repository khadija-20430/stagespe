const fs = require('fs');
const path = require('path');
const agreementsModel = require('../models/agreementsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const pool = require('../db');
const { translateList, translateOne, translateRelatedField, autoTranslateAndSave, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');
function deleteOldFile(fileUrl) {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
    const filePath = path.join(__dirname, '..', fileUrl);
    fs.unlink(filePath, () => {});
}

exports.getPublic = async(req, res) => {
    try {
        const agreements = await agreementsModel.findAll({
            ...req.query,
            statut_publication: 'published',
        });
        const translated = await translateList('agreement', agreements, req.query.lang);
        const withPartnerNames = await translateRelatedField(translated, req.query.lang, {
            entityType: 'partner', idField: 'partner_id', nameField: 'partner_name',
        });
        res.json(withPartnerNames);
    } catch (err) {
        sendError(res, err);
    }
};

exports.getAdmin = async(req, res) => {
    try {
        const agreements = await agreementsModel.findAll(req.query);
        res.json(agreements);
    } catch (err) {
        sendError(res, err);
    }
};

exports.getAllAdminPreview = async(req, res) => {
    try {
        const agreements = await agreementsModel.findAll(req.query);
        const translated = await translateList('agreement', agreements, req.query.lang);
        const withPartnerNames = await translateRelatedField(translated, req.query.lang, {
            entityType: 'partner', idField: 'partner_id', nameField: 'partner_name',
        });
        res.json(withPartnerNames);
    } catch (err) {
        sendError(res, err);
    }
};

exports.getExpiringSoon = async(req, res) => {
    try {
        const agreements = await agreementsModel.findExpiringSoon();
        res.json(agreements);
    } catch (err) {
        sendError(res, err);
    }
};

exports.getAgreementWithDocuments = async(id) => {
    const agreement = await agreementsModel.findById(id);
    if (!agreement) return null;

    const documents = await pool.query(
        `SELECT d.* FROM documents d
         JOIN agreement_documents ad ON d.id = ad.document_id
         WHERE ad.agreement_id = $1`,
        [id]
    );

    agreement.documents = documents.rows;
    return agreement;
};

exports.getById = async(req, res) => {
    try {
        const id = req.params.id;

        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'ID invalide' });
        }

        const agreement = await exports.getAgreementWithDocuments(id);

        if (!agreement) {
            return res.status(404).json({ error: 'Accord non trouvé' });
        }

        const translated = await translateOne('agreement', agreement, req.query.lang);
        const [withPartnerName] = await translateRelatedField([translated], req.query.lang, {
            entityType: 'partner', idField: 'partner_id', nameField: 'partner_name',
        });
        res.json(withPartnerName);
    } catch (err) {
        sendError(res, err);
    }
};

exports.getTranslations = async(req, res) => {
    try {
        res.json(await getAllTranslations('agreement', req.params.id));
    } catch (err) { sendError(res, err); }
};

exports.updateTranslations = async(req, res) => {
    try {
        await upsertTranslations('agreement', req.params.id, req.body);
        const updated = await getAllTranslations('agreement', req.params.id);
        res.json(updated);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const { start_date, end_date, partner_id } = req.body;

        if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
        }

        if (!partner_id) {
            return res.status(400).json({ error: 'Le champ partner_id est obligatoire' });
        }

        const fichier_pdf = req.file ? `/uploads/${req.file.filename}` : null;
        const agreement = await agreementsModel.create({
            ...req.body,
            fichier_pdf,
            created_by: req.user.id
        });

        await logAction(req.user.id, 'create', 'agreement', agreement.id, null, req);
        await autoTranslateAndSave('agreement', agreement.id, req.body);
        res.status(201).json(agreement);
    } catch (err) {
        sendError(res, err);
    }
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

        const agreement = await agreementsModel.update(
            req.params.id,
            {...req.body, fichier_pdf },
            req.user.id,
            req.ip
        );

        if (!agreement) {
            return res.status(404).json({ error: 'Accord non trouvé' });
        }

        await autoTranslateAndSave('agreement', req.params.id, req.body);
        res.json(agreement);
    } catch (err) {
        sendError(res, err);
    }
};

exports.remove = async(req, res) => {
    try {
        const existing = await agreementsModel.getFichierPdf(req.params.id);
        const agreement = await agreementsModel.remove(req.params.id);

        if (!agreement) {
            return res.status(404).json({ error: 'Accord non trouvé' });
        }

        if (existing) {
            deleteOldFile(existing.fichier_pdf);
        }

        await deleteTranslations('agreement', req.params.id);
        await logAction(req.user.id, 'delete', 'agreement', req.params.id, null, req);
        res.json({ message: 'Accord supprimé', deleted: agreement });
    } catch (err) {
        sendError(res, err);
    }
};