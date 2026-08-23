const auditLogsModel = require('../models/auditLogsModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const logs = await auditLogsModel.findAll(req.query);
        res.json(logs);
    } catch (err) { sendError(res, err); }
};

exports.getDocumentAccess = async(req, res) => {
    try {
        const logs = await auditLogsModel.findDocumentAccess(req.params.documentId);
        res.json(logs);
    } catch (err) { sendError(res, err); }
};