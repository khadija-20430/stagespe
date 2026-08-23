const institutionsModel = require('../models/institutionsModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const institutions = await institutionsModel.findAll(req.query);
        res.json(institutions);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const { name, city_id, partner_id } = req.body;
        const institution = await institutionsModel.create(name, city_id, partner_id);
        res.status(201).json(institution);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const { name, city_id, partner_id } = req.body;
        const institution = await institutionsModel.update(req.params.id, name, city_id, partner_id);
        if (!institution) return res.status(404).json({ error: 'Institution non trouvée' });
        res.json(institution);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const institution = await institutionsModel.remove(req.params.id);
        if (!institution) return res.status(404).json({ error: 'Institution non trouvée' });
        res.json({ message: 'Institution supprimée' });
    } catch (err) { sendError(res, err); }
};