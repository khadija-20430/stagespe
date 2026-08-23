const countriesModel = require('../models/countriesModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const countries = await countriesModel.findAll();
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