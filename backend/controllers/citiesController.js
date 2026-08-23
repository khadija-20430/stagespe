const citiesModel = require('../models/citiesModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const cities = await citiesModel.findAll(req.query.country_id);
        res.json(cities);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const { name, country_id } = req.body;
        const city = await citiesModel.create(name, country_id);
        res.status(201).json(city);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const { name, country_id } = req.body;
        const city = await citiesModel.update(req.params.id, name, country_id);
        if (!city) return res.status(404).json({ error: 'Ville non trouvée' });
        res.json(city);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const city = await citiesModel.remove(req.params.id);
        if (!city) return res.status(404).json({ error: 'Ville non trouvée' });
        res.json({ message: 'Ville supprimée' });
    } catch (err) { sendError(res, err); }
};