const path = require('path');
const documentsModel = require('../models/documentsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { upload } = require('../middleware/upload');
const { translateList, translateOne, autoTranslateAndSave, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

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

exports.getAllPublic = async(req, res) => {
    try {
        const documents = await documentsModel.findAllPublic(req.query);
        res.json(await translateList('document', documents, req.query.lang));
    } catch (err) { sendError(res, err); }
};

exports.getAllAdmin = async(req, res) => {
    try {
        const documents = await documentsModel.findAllAdmin();
        res.json(documents);
    } catch (err) { sendError(res, err); }
};

exports.getAllAdminPreview = async(req, res) => {
    try {
        const documents = await documentsModel.findAllAdmin();
        const translated = await translateList('document', documents, req.query.lang);
        res.json(translated);
    } catch (err) { sendError(res, err); }
};

exports.getExpired = async(req, res) => {
    try {
        const documents = await documentsModel.findExpired();
        res.json(documents);
    } catch (err) { sendError(res, err); }
};

exports.getById = async(req, res) => {
    try {
        const doc = await documentsModel.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document non trouvé' });

        const links = await documentsModel.findLinksForDocument(req.params.id);
        await documentsModel.logAccess(req.params.id, null, req.ip, req.headers['user-agent'], 'view');

        const translated = await translateOne('document', doc, req.query.lang);
        res.json({ ...translated, links });
    } catch (err) { sendError(res, err); }
};

exports.getTranslations = async(req, res) => {
    try {
        res.json(await getAllTranslations('document', req.params.id));
    } catch (err) { sendError(res, err); }
};

exports.updateTranslations = async(req, res) => {
    try {
        await upsertTranslations('document', req.params.id, req.body);
        const updated = await getAllTranslations('document', req.params.id);
        res.json(updated);
    } catch (err) { sendError(res, err); }
};

exports.download = async(req, res) => {
    try {
        const doc = await documentsModel.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document non trouvé' });

        await documentsModel.logAccess(req.params.id, null, req.ip, req.headers['user-agent'], 'download');

        res.json({ fichier_url: doc.fichier_url });
    } catch (err) { sendError(res, err); }
};

exports.getRevisions = async(req, res) => {
    try {
        const revisions = await documentsModel.findRevisions(req.params.id);
        res.json(revisions);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const doc = await documentsModel.create({...req.body, uploaded_by: req.user.id });
        await logAction(req.user.id, 'create', 'document', doc.id, null, req);
        await autoTranslateAndSave('document', doc.id, req.body);
        res.status(201).json(doc);
    } catch (err) { sendError(res, err); }
};

exports.createLink = async(req, res) => {
    try {
        const { entity_type, entity_id } = req.body;
        const ok = await documentsModel.createLink(entity_type, req.params.id, entity_id);
        if (!ok) return res.status(400).json({ error: 'entity_type invalide (programme, project, call, agreement, mobility)' });
        res.status(201).json({ message: 'Lien créé' });
    } catch (err) { sendError(res, err); }
};

exports.removeLink = async(req, res) => {
    try {
        const { entity_type, entity_id } = req.body;
        const ok = await documentsModel.removeLink(entity_type, req.params.id, entity_id);
        if (!ok) return res.status(400).json({ error: 'entity_type invalide' });
        res.json({ message: 'Lien supprimé' });
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const { fichier_url, change_note } = req.body;
        const existing = await documentsModel.getRevisionSourceInfo(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Document non trouvé' });

        if (fichier_url && fichier_url !== existing.fichier_url) {
            await documentsModel.createRevision(
                req.params.id, existing.version, existing.fichier_url, existing.file_size, req.user.id, change_note
            );
        }

        const doc = await documentsModel.update(req.params.id, req.body);
        await logAction(req.user.id, 'update', 'document', req.params.id, { new_version: req.body.version }, req);
        await autoTranslateAndSave('document', req.params.id, req.body);
        res.json(doc);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const doc = await documentsModel.remove(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document non trouvé' });
        await deleteTranslations('document', req.params.id);
        await logAction(req.user.id, 'delete', 'document', req.params.id, null, req);
        res.json({ message: 'Document supprimé', deleted: doc });
    } catch (err) { sendError(res, err); }
};

exports.publish = async(req, res) => {
    try {
        const doc = await documentsModel.publish(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document non trouvé' });
        await logAction(req.user.id, 'publish', 'document', req.params.id, null, req);
        res.json(doc);
    } catch (err) { sendError(res, err); }
};

exports.archive = async(req, res) => {
    try {
        const doc = await documentsModel.archive(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Document non trouvé' });
        await logAction(req.user.id, 'archive', 'document', req.params.id, null, req);
        res.json(doc);
    } catch (err) { sendError(res, err); }
};