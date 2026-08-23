const partnerContactsModel = require('../models/partnerContactsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

exports.getPublicByPartner = async(req, res) => {
    try {
        const contacts = await partnerContactsModel.findPublicByPartner(req.params.partnerId);
        res.json(contacts);
    } catch (err) { sendError(res, err); }
};

exports.getAllByPartner = async(req, res) => {
    try {
        const contacts = await partnerContactsModel.findAllByPartner(req.params.partnerId);
        res.json(contacts);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const contact = await partnerContactsModel.create(req.body);
        await logAction(req.user.id, 'create', 'partner_contact', contact.id, null, req);
        res.status(201).json(contact);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const contact = await partnerContactsModel.update(req.params.id, req.body);
        if (!contact) return res.status(404).json({ error: 'Contact non trouvé' });
        res.json(contact);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const contact = await partnerContactsModel.remove(req.params.id);
        if (!contact) return res.status(404).json({ error: 'Contact non trouvé' });
        await logAction(req.user.id, 'delete', 'partner_contact', req.params.id, null, req);
        res.json({ message: 'Contact supprimé' });
    } catch (err) { sendError(res, err); }
};