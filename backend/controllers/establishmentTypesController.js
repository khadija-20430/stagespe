const establishmentTypesModel = require('../models/establishmentTypesModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const types = await establishmentTypesModel.findAll();
        res.json(types);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const { label } = req.body;
        const type = await establishmentTypesModel.create(label);
        res.status(201).json(type);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const { label } = req.body;
        const type = await establishmentTypesModel.update(req.params.id, label);
        if (!type) return res.status(404).json({ error: 'Type d\'établissement non trouvé' });
        res.json(type);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const type = await establishmentTypesModel.remove(req.params.id);
        if (!type) return res.status(404).json({ error: 'Type d\'établissement non trouvé' });
        res.json({ message: 'Type d\'établissement supprimé' });
    } catch (err) { sendError(res, err); }
};