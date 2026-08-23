const mobilityModel = require('../models/mobilityModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { translateList, translateOne, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

exports.getAll = async(req, res) => {
    try {
        const rows = await mobilityModel.findAllPublished(req.query);
        res.json(await translateList('mobility', rows, req.query.lang));
    } catch (err) { sendError(res, err); }
};

exports.getAllAdmin = async(req, res) => {
    try {
        const rows = await mobilityModel.findAllAdmin();
        res.json(rows);
    } catch (err) { sendError(res, err); }
};

exports.getOne = async(req, res) => {
    try {
        const mobility = await mobilityModel.findById(req.params.id);
        if (!mobility) return res.status(404).json({ error: 'Offre non trouvée' });

        const languageRequirements = await mobilityModel.getLanguageRequirements(req.params.id);
        const translated = await translateOne('mobility', mobility, req.query.lang);
        res.json({...translated, language_requirements: languageRequirements });
    } catch (err) { sendError(res, err); }
};

exports.getTranslations = async(req, res) => {
    try {
        res.json(await getAllTranslations('mobility', req.params.id));
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const mobility = await mobilityModel.create(req.body, req.user.id);
        await logAction(req.user.id, 'create', 'mobility', mobility.id, null, req);
        await upsertTranslations('mobility', mobility.id, req.body.translations);
        res.status(201).json(mobility);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const mobility = await mobilityModel.update(req.params.id, req.body);
        if (!mobility) return res.status(404).json({ error: 'Offre non trouvée' });
        await logAction(req.user.id, 'update', 'mobility', req.params.id, null, req);
        await upsertTranslations('mobility', req.params.id, req.body.translations);
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