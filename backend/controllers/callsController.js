const callsModel = require('../models/callsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { translateList, translateOne, autoTranslateAndSave, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

exports.getAllPublished = async(req, res) => {
    try {
        const calls = await callsModel.findAllPublished(req.query);
        res.json(await translateList('call', calls, req.query.lang));
    } catch (err) { sendError(res, err); }
};

exports.getAllAdmin = async(req, res) => {
    try {
        const calls = await callsModel.findAllAdmin();
        res.json(calls);
    } catch (err) { sendError(res, err); }
};

exports.getAllAdminPreview = async(req, res) => {
    try {
        const rows = await callsModel.findAllAdmin();
        const translated = await translateList('call', rows, req.query.lang);
        res.json(translated);
    } catch (err) { sendError(res, err); }
};

exports.getClosingSoon = async(req, res) => {
    try {
        const calls = await callsModel.findClosingSoon();
        res.json(calls);
    } catch (err) { sendError(res, err); }
};

exports.getById = async(req, res) => {
    try {
        const call = await callsModel.findById(req.params.id);
        if (!call) return res.status(404).json({ error: 'Appel non trouvé' });
        res.json({...(await translateOne('call', call, req.query.lang)), themes: call.themes, countries: call.countries, documents: call.documents });
    } catch (err) { sendError(res, err); }
};

exports.getTranslations = async(req, res) => {
    try {
        res.json(await getAllTranslations('call', req.params.id));
    } catch (err) { sendError(res, err); }
};

exports.updateTranslations = async(req, res) => {
    try {
        await upsertTranslations('call', req.params.id, req.body);
        const updated = await getAllTranslations('call', req.params.id);
        res.json(updated);
    } catch (err) { sendError(res, err); }
};
exports.create = async(req, res) => {
    try {
        const { publication_date, deadline } = req.body;
        if (publication_date && deadline && new Date(deadline) < new Date(publication_date)) {
            return res.status(400).json({ error: 'La deadline ne peut pas être antérieure à la date de publication' });
        }

        const call = await callsModel.create(req.body, req.user.id);
        await logAction(req.user.id, 'create', 'call', call.id, null, req);
        await autoTranslateAndSave('call', call.id, req.body);
        res.status(201).json(call);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const { publication_date, deadline } = req.body;
        if (publication_date && deadline && new Date(deadline) < new Date(publication_date)) {
            return res.status(400).json({ error: 'La deadline ne peut pas être antérieure à la date de publication' });
        }

        const call = await callsModel.update(req.params.id, req.body, req.user.id, req.ip);
        if (!call) return res.status(404).json({ error: 'Appel non trouvé' });
        await autoTranslateAndSave('call', req.params.id, req.body);
        res.json(call);
    } catch (err) { sendError(res, err); }
};

exports.publish = async(req, res) => {
    try {
        const call = await callsModel.publish(req.params.id);
        if (!call) return res.status(404).json({ error: 'Appel non trouvé' });
        await logAction(req.user.id, 'publish', 'call', req.params.id, null, req);
        res.json(call);
    } catch (err) { sendError(res, err); }
};

exports.archive = async(req, res) => {
    try {
        const call = await callsModel.archive(req.params.id);
        if (!call) return res.status(404).json({ error: 'Appel non trouvé' });
        await logAction(req.user.id, 'archive', 'call', req.params.id, null, req);
        res.json(call);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const call = await callsModel.remove(req.params.id);
        if (!call) return res.status(404).json({ error: 'Appel non trouvé' });
        await deleteTranslations('call', req.params.id);
        await logAction(req.user.id, 'delete', 'call', req.params.id, null, req);
        res.json({ message: 'Appel supprimé', deleted: call });
    } catch (err) { sendError(res, err); }
};