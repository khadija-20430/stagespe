const documentCategoriesModel = require('../models/documentCategoriesModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const categories = await documentCategoriesModel.findAll();
        res.json(categories);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const { code, label } = req.body;
        const category = await documentCategoriesModel.create(code, label);
        res.status(201).json(category);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const { code, label } = req.body;
        const category = await documentCategoriesModel.update(req.params.id, code, label);
        if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' });
        res.json(category);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const category = await documentCategoriesModel.remove(req.params.id);
        if (!category) return res.status(404).json({ error: 'Catégorie non trouvée' });
        res.json({ message: 'Catégorie supprimée' });
    } catch (err) { sendError(res, err); }
};