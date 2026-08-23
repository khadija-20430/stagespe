const statsModel = require('../models/statsModel');
const sendError = require('../middleware/errorResponse');

exports.getBasic = async(req, res) => {
    try {
        const stats = await statsModel.findBasic();
        res.json(stats);
    } catch (err) { sendError(res, err); }
};

exports.getFull = async(req, res) => {
    try {
        const stats = await statsModel.findFull();
        res.json(stats);
    } catch (err) { sendError(res, err); }
};