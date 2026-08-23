const actionTypesModel = require('../models/actionTypesModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const actionTypes = await actionTypesModel.findAll();
        res.json(actionTypes);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const { label } = req.body;
        const actionType = await actionTypesModel.create(label);
        res.status(201).json(actionType);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const { label } = req.body;
        const actionType = await actionTypesModel.update(req.params.id, label);
        if (!actionType) return res.status(404).json({ error: 'Type d\'action non trouvé' });
        res.json(actionType);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const actionType = await actionTypesModel.remove(req.params.id);
        if (!actionType) return res.status(404).json({ error: 'Type d\'action non trouvé' });
        res.json({ message: 'Type d\'action supprimé' });
    } catch (err) { sendError(res, err); }
};