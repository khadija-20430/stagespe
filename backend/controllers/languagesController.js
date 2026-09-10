const languagesModel = require('../models/languagesModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const languages = await languagesModel.findAllActive();
        res.json(languages);
    } catch (err) { sendError(res, err); }
};
// languagesController.js — nouvelle méthode, on ne touche pas getAll
exports.getAllWithId = async(req, res) => {
    try {
        const languages = await languagesModel.findAllWithId();
        res.json(languages);
    } catch (err) { sendError(res, err); }
};