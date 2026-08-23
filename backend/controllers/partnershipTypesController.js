const partnershipTypesModel = require('../models/partnershipTypesModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const types = await partnershipTypesModel.findAll();
        res.json(types);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const type = await partnershipTypesModel.create(req.body.label);
        res.status(201).json(type);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const type = await partnershipTypesModel.update(req.params.id, req.body.label);
        if (!type) return res.status(404).json({ error: 'Type de partenariat non trouvé' });
        res.json(type);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const type = await partnershipTypesModel.remove(req.params.id);
        if (!type) return res.status(404).json({ error: 'Type de partenariat non trouvé' });
        res.json({ message: 'Type de partenariat supprimé' });
    } catch (err) { sendError(res, err); }
};