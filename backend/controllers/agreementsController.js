const fs = require('fs');
const path = require('path');
const agreementsModel = require('../models/agreementsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const pool = require('../db');

function deleteOldFile(fileUrl) {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
    const filePath = path.join(__dirname, '..', fileUrl);
    fs.unlink(filePath, () => {});
}

exports.getAll = async(req, res) => {
    try {
        const agreements = await agreementsModel.findAll(req.query);
        res.json(agreements);
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

        // Sécurité : Empêche le routage vers getById si l'ID n'est pas un nombre
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'ID invalide' });
        }

        const agreement = await exports.getAgreementWithDocuments(id);
        
        if (!agreement) {
            return res.status(404).json({ error: 'Accord non trouvé' });
        }
        
        res.json(agreement);
    } catch (err) { 
        sendError(res, err); 
    }
};

exports.create = async(req, res) => {
    try {
        const { start_date, end_date, partner_id } = req.body;

        // Validation des dates
        if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
            return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
        }

        // Validation critique du partner_id (cause de l'erreur 23502)
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
        
        await logAction(req.user.id, 'delete', 'agreement', req.params.id, null, req);
        res.json({ message: 'Accord supprimé', deleted: agreement });
    } catch (err) { 
        sendError(res, err); 
    }
};

module.exports = exports;