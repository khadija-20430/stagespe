const themesModel = require('../models/themesModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const themes = await themesModel.findAll();
        res.json(themes);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const theme = await themesModel.create(req.body.name);
        res.status(201).json(theme);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const theme = await themesModel.remove(req.params.id);
        if (!theme) return res.status(404).json({ error: 'Thème non trouvé' });
        res.json({ message: 'Thème supprimé' });
    } catch (err) { sendError(res, err); }
};