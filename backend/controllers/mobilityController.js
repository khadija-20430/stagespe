const mobilityModel = require('../models/mobilityModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { translateList, translateOne, translateRelatedField, autoTranslateAndSave, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

exports.getAll = async(req, res) => {
    try {
        const rows = await mobilityModel.findAllPublished(req.query);
        const translated = await translateList('mobility', rows, req.query.lang);
        const withPartner = await translateRelatedField(translated, req.query.lang, {
            entityType: 'partner', idField: 'destination_partner_id', nameField: 'partner_name',
        });
        res.json(withPartner);
    } catch (err) { sendError(res, err); }
};

exports.getAllAdmin = async(req, res) => {
    try {
        const rows = await mobilityModel.findAllAdmin();
        res.json(rows);
    } catch (err) { sendError(res, err); }
};

exports.getAllAdminPreview = async(req, res) => {
    try {
        const rows = await mobilityModel.findAllAdmin();
        const translated = await translateList('mobility', rows, req.query.lang);
        res.json(translated);
    } catch (err) { sendError(res, err); }
};

exports.getOne = async(req, res) => {
    try {
        const mobility = await mobilityModel.findById(req.params.id);
        if (!mobility) return res.status(404).json({ error: 'Offre non trouvée' });

        const languageRequirements = await mobilityModel.getLanguageRequirements(req.params.id);
        const translated = await translateOne('mobility', mobility, req.query.lang);
        const [withPartner] = await translateRelatedField([translated], req.query.lang, {
            entityType: 'partner', idField: 'destination_partner_id', nameField: 'partner_name',
        });
        res.json({ ...withPartner, language_requirements: languageRequirements });
    } catch (err) { sendError(res, err); }
};

exports.getTranslations = async(req, res) => {
    try {
        res.json(await getAllTranslations('mobility', req.params.id));
    } catch (err) { sendError(res, err); }
};


exports.updateTranslations = async(req, res) => {
    try {
        await upsertTranslations('mobility', req.params.id, req.body);
        const updated = await getAllTranslations('mobility', req.params.id);
        res.json(updated);
    } catch (err) { sendError(res, err); }
};
exports.create = async(req, res) => {
    try {
        const mobility = await mobilityModel.create(req.body, req.user.id);
        await logAction(req.user.id, 'create', 'mobility', mobility.id, null, req);
        await autoTranslateAndSave('mobility', mobility.id, req.body);
        res.status(201).json(mobility);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const mobility = await mobilityModel.update(req.params.id, req.body);
        if (!mobility) return res.status(404).json({ error: 'Offre non trouvée' });
        await logAction(req.user.id, 'update', 'mobility', req.params.id, null, req);
        await autoTranslateAndSave('mobility', req.params.id, req.body);
        res.json(mobility);
    } catch (err) { sendError(res, err); }
};

exports.publish = async(req, res) => {
    try {
        const mobility = await mobilityModel.publish(req.params.id);
        if (!mobility) return res.status(404).json({ error: 'Offre non trouvée' });
        await logAction(req.user.id, 'publish', 'mobility', req.params.id, null, req);
        res.json(mobility);
    } catch (err) { sendError(res, err); }
};

exports.archive = async(req, res) => {
    try {
        const mobility = await mobilityModel.archive(req.params.id);
        if (!mobility) return res.status(404).json({ error: 'Offre non trouvée' });
        await logAction(req.user.id, 'archive', 'mobility', req.params.id, null, req);
        res.json(mobility);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const mobility = await mobilityModel.remove(req.params.id);
        if (!mobility) return res.status(404).json({ error: 'Offre non trouvée' });
        await deleteTranslations('mobility', req.params.id);
        await logAction(req.user.id, 'delete', 'mobility', req.params.id, null, req);
        res.json({ message: 'Offre supprimée', deleted: mobility });
    } catch (err) { sendError(res, err); }
};
exports.updateLanguageRequirements = async (req, res) => {
    try {
        await mobilityModel.updateLanguageRequirements(req.params.id, req.body.language_requirements || []);
        const languageRequirements = await mobilityModel.getLanguageRequirements(req.params.id);
        await logAction(req.user.id, 'update', 'mobility', req.params.id, null, req);
        res.json(languageRequirements);
    } catch (err) { sendError(res, err); }
};