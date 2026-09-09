const countriesModel = require('../models/countriesModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const lang = req.query.lang || 'fr';
        const countries = await countriesModel.findAllByLanguage(lang);
        res.json(countries);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const { name, iso_code, region } = req.body;
        const country = await countriesModel.create(name, iso_code, region);
        res.status(201).json(country);
    } catch (err) { sendError(res, err); }
};

exports.getTranslations = async(req, res) => {
    try {
        const translations = await countriesModel.findTranslations(req.params.id);
        res.json(translations);
    } catch (err) { sendError(res, err); }
};

exports.updateTranslations = async(req, res) => {
    try {
        const updated = await countriesModel.upsertTranslations(req.params.id, req.body);
        res.json(updated);
    } catch (err) { sendError(res, err); }
};