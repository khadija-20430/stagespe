const partnersModel = require('../models/partnersModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { uploadToSupabase } = require('../utils/storage'); // en haut du fichier
const { translateList, translateOne, autoTranslateAndSave, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

// public liste partenaire et carte partenaires
exports.getAll = async(req, res) => {
    try {
        const rows = await partnersModel.findAllPublished(req.query);
        res.json(await translateList('partner', rows, req.query.lang));
    } catch (err) { sendError(res, err); }
};

exports.getForMap = async(req, res) => {
    try {
        const rows = await partnersModel.findAllForMap();
        res.json(rows);
    } catch (err) { sendError(res, err); }
};
// admin
exports.getAllAdmin = async(req, res) => {
    try {
        const rows = await partnersModel.findAllAdmin();
        res.json(rows);
    } catch (err) { sendError(res, err); }
};

exports.getAllAdminPreview = async(req, res) => {
    try {
        const rows = await partnersModel.findAllAdmin();
        const translated = await translateList('partner', rows, req.query.lang);
        res.json(translated);
    } catch (err) { sendError(res, err); }
};

exports.getOne = async(req, res) => {
    try {
        const partner = await partnersModel.findById(req.params.id);
        if (!partner) return res.status(404).json({ error: 'Partenaire non trouvé' });
 
       
        const [agreements, contacts, projects, themes] = await Promise.all([
            partnersModel.findAgreementsByPartner(req.params.id),
            partnersModel.findPublicContactsByPartner(req.params.id),
            partnersModel.findPublishedProjectsByPartner(req.params.id),
            partnersModel.findThemesByPartner(req.params.id),
        ]);
 
        res.json({
            ...(await translateOne('partner', partner, req.query.lang)),
            agreements,
            contacts,
            projects,
            themes,
        });
    } catch (err) { sendError(res, err); }
};

exports.getTranslations = async(req, res) => {
    try {
        res.json(await getAllTranslations('partner', req.params.id));
    } catch (err) { sendError(res, err); }
};

exports.updateTranslations = async(req, res) => {
    try {
        await upsertTranslations('partner', req.params.id, req.body);
        const updated = await getAllTranslations('partner', req.params.id);
        res.json(updated);
    } catch (err) { sendError(res, err); }
};
// creation d un partenaire 
exports.create = async(req, res) => {
    try {
const logo_url = req.file ? await uploadToSupabase(req.file) : null;       
 const partner = await partnersModel.create({...req.body, logo_url }, req.user.id);
        await logAction(req.user.id, 'create', 'partner', partner.id, null, req);
        await autoTranslateAndSave('partner', partner.id, req.body);
        res.status(201).json(partner);
    } catch (err) { sendError(res, err); }
};

// mise a jour d un partenaire
exports.update = async(req, res) => {
    try {
        let logo_url = req.body.logo_url || null;

        if (req.file) {
            const existing = await partnersModel.findLogoUrlById(req.params.id);
            if (existing) partnersModel.deleteOldLogoFile(existing.logo_url);
    logo_url = await uploadToSupabase(req.file);
        }

        const partner = await partnersModel.update(
            req.params.id, {...req.body, logo_url }, { userId: req.user.id, ip: req.ip }
        );

        if (!partner) return res.status(404).json({ error: 'Partenaire non trouvé' });
        await autoTranslateAndSave('partner', req.params.id, req.body);
        res.json(partner);
    } catch (err) { sendError(res, err); }
};
// statuts de publication d un partenaire
exports.publish = async(req, res) => {
    try {
        const partner = await partnersModel.publish(req.params.id);
        if (!partner) return res.status(404).json({ error: 'Partenaire non trouvé' });
        await logAction(req.user.id, 'publish', 'partner', req.params.id, null, req);
        res.json(partner);
    } catch (err) { sendError(res, err); }
};

exports.archive = async(req, res) => {
    try {
        const partner = await partnersModel.archive(req.params.id);
        if (!partner) return res.status(404).json({ error: 'Partenaire non trouvé' });
        await logAction(req.user.id, 'archive', 'partner', req.params.id, null, req);
        res.json(partner);
    } catch (err) { sendError(res, err); }
};

exports.duplicate = async(req, res) => {
    try {
        const partner = await partnersModel.duplicate(req.params.id, req.user.id);
        if (!partner) return res.status(404).json({ error: 'Partenaire non trouvé' });
        await logAction(req.user.id, 'duplicate', 'partner', partner.id, { source_id: req.params.id }, req);
        res.status(201).json(partner);
    } catch (err) { sendError(res, err); }
};
// suppression d un partenaire
exports.remove = async(req, res) => {
    try {
        const existing = await partnersModel.findLogoUrlById(req.params.id);
        const partner = await partnersModel.remove(req.params.id);
        if (!partner) return res.status(404).json({ error: 'Partenaire non trouvé' });
        if (existing) partnersModel.deleteOldLogoFile(existing.logo_url);
        await deleteTranslations('partner', req.params.id);
        await logAction(req.user.id, 'delete', 'partner', req.params.id, null, req);
        res.json({ message: 'Partenaire supprimé', deleted: partner });
    } catch (err) { sendError(res, err); }
};