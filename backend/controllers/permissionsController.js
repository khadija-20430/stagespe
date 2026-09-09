const permissionsModel = require('../models/permissionsModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const permissions = await permissionsModel.findAll();
        res.json(permissions);
    } catch (err) { sendError(res, err); }
};