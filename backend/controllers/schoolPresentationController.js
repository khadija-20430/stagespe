const path = require('path');
const schoolPresentationModel = require('../models/schoolPresentationModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { upload } = require('../middleware/upload');

exports.uploadFile = (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
        res.json({
            fichier_url: `/uploads/${req.file.filename}`,
            file_size: req.file.size,
            file_format: path.extname(req.file.originalname).replace('.', ''),
        });
    });
};

// public
exports.getAll = async(req, res) => {
    try {
        const presentations = await schoolPresentationModel.findAll();
        res.json(presentations);
    } catch (err) { sendError(res, err); }
};

exports.getById = async(req, res) => {
    try {
        const presentation = await schoolPresentationModel.findById(req.params.id);
        if (!presentation) return res.status(404).json({ error: 'Présentation non trouvée' });
        res.json(presentation);
    } catch (err) { sendError(res, err); }
};

// pour la langue
exports.getByLanguage = async(req, res) => {
    try {
        const translation = await schoolPresentationModel.findByLanguageCode(req.params.code);
        if (!translation) return res.status(404).json({ error: 'Aucune présentation pour cette langue' });
        res.json(translation);
    } catch (err) { sendError(res, err); }
};

// admin
exports.getAllAdmin = async(req, res) => {
    try {
        const presentations = await schoolPresentationModel.findAllAdmin();
        res.json(presentations);
    } catch (err) { sendError(res, err); }
};
// creation de la presentation 
exports.create = async(req, res) => {
    try {
        const { language_id, titre, description, visibilite, fichier_url } = req.body;

        // Accepter soit un fichier uploadé, soit une URL déjà uploadée
        const file = req.file ? {
            fichier_url: `/uploads/${req.file.filename}`,
            file_format: path.extname(req.file.originalname).replace('.', ''),
            file_size: req.file.size,
        } : null;

        if (language_id && !file && !fichier_url) {
            return res.status(400).json({ error: 'Un fichier est obligatoire' });
        }

        const presentation = await schoolPresentationModel.create({
            visibilite: visibilite || 'draft',
            created_by: req.user.id,
            translation: language_id ? {
                language_id,
                titre,
                description,
                fichier_url: file ? file.fichier_url : fichier_url,
                file_format: file ? file.file_format : null,
                file_size: file ? file.file_size : null,
            } : null,
        });

        await logAction(req.user.id, 'create', 'school_presentation', presentation.id, null, req);
        res.status(201).json(presentation);
    } catch (err) { sendError(res, err); }
};
// ajouter une traduction a une presentation existante
exports.addTranslation = async(req, res) => {
    try {
        const { language_id, titre, description, fichier_url } = req.body;

        const file = req.file ? {
            fichier_url: `/uploads/${req.file.filename}`,
            file_format: path.extname(req.file.originalname).replace('.', ''),
            file_size: req.file.size,
        } : null;

        if (!file && !fichier_url) {
            return res.status(400).json({ error: 'Un fichier est obligatoire' });
        }
        if (!language_id || !titre) {
            return res.status(400).json({ error: 'language_id et titre sont obligatoires' });
        }

        const translation = await schoolPresentationModel.addTranslation(req.params.id, {
            language_id,
            titre,
            description,
            fichier_url: file ? file.fichier_url : fichier_url,
            file_format: file ? file.file_format : null,
            file_size: file ? file.file_size : null,
        });

        await logAction(req.user.id, 'create', 'school_presentation_translation', translation.id, null, req);
        res.status(201).json(translation);
    } catch (err) { sendError(res, err); }
};

// modifier une traduction 
exports.updateTranslation = async(req, res) => {
    try {
        const { titre, description } = req.body;
        const translation = await schoolPresentationModel.updateTranslation(req.params.translationId, { titre, description });
        if (!translation) return res.status(404).json({ error: 'Traduction non trouvée' });

        await logAction(req.user.id, 'update', 'school_presentation_translation', translation.id, null, req);
        res.json(translation);
    } catch (err) { sendError(res, err); }
};

// remplacer le fichier d un presentation ou de sa traduction
exports.replaceFile = async(req, res) => {
    try {
        const file = req.file ? {
            fichier_url: `/uploads/${req.file.filename}`,
            file_format: path.extname(req.file.originalname).replace('.', ''),
            file_size: req.file.size,
        } : null;

        if (!file) return res.status(400).json({ error: 'Le fichier est obligatoire' });

        const translation = await schoolPresentationModel.replaceFile(req.params.translationId, file, req.user.id);
        if (!translation) return res.status(404).json({ error: 'Traduction non trouvée' });

        await logAction(req.user.id, 'replace_file', 'school_presentation_translation', translation.id, null, req);
        res.json(translation);
    } catch (err) { sendError(res, err); }
};

exports.getRevisions = async(req, res) => {
    try {
        const revisions = await schoolPresentationModel.getRevisions(req.params.translationId);
        res.json(revisions);
    } catch (err) { sendError(res, err); }
};
// mettre a jour la visibilite d une presentation
exports.updateVisibilite = async(req, res) => {
    try {
        const { visibilite } = req.body;
        if (!['public', 'draft'].includes(visibilite)) {
            return res.status(400).json({ error: 'visibilite doit être "public" ou "draft"' });
        }
        const presentation = await schoolPresentationModel.updateVisibilite(req.params.id, visibilite);
        if (!presentation) return res.status(404).json({ error: 'Présentation non trouvée' });

        await logAction(req.user.id, 'update', 'school_presentation', presentation.id, null, req);
        res.json(presentation);
    } catch (err) { sendError(res, err); }
};
// supprimer une presentation
exports.remove = async(req, res) => {
    try {
        const presentation = await schoolPresentationModel.remove(req.params.id);
        if (!presentation) return res.status(404).json({ error: 'Présentation non trouvée' });

        await logAction(req.user.id, 'delete', 'school_presentation', req.params.id, null, req);
        res.json({ message: 'Présentation supprimée', deleted: presentation });
    } catch (err) { sendError(res, err); }
};
// supprimer une traduction
exports.removeTranslation = async(req, res) => {
    try {
        const translation = await schoolPresentationModel.removeTranslation(req.params.translationId);
        if (!translation) return res.status(404).json({ error: 'Traduction non trouvée' });

        await logAction(req.user.id, 'delete', 'school_presentation_translation', req.params.translationId, null, req);
        res.json({ message: 'Traduction supprimée', deleted: translation });
    } catch (err) { sendError(res, err); }
};


// publication status
exports.publish = async(req, res) => {
    try {
        const presentation = await schoolPresentationModel.publish(req.params.id);
        if (!presentation) return res.status(404).json({ error: 'Présentation non trouvée' });
        await logAction(req.user.id, 'publish', 'school_presentation', req.params.id, null, req);
        res.json(presentation);
    } catch (err) { sendError(res, err); }
};

exports.archive = async(req, res) => {
    try {
        const presentation = await schoolPresentationModel.archive(req.params.id);
        if (!presentation) return res.status(404).json({ error: 'Présentation non trouvée' });
        await logAction(req.user.id, 'archive', 'school_presentation', req.params.id, null, req);
        res.json(presentation);
    } catch (err) { sendError(res, err); }
};

module.exports = exports;