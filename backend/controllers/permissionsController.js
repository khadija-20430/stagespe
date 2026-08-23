const permissionsModel = require('../models/permissionsModel');
const sendError = require('../middleware/errorResponse');

// Toutes les permissions, groupées par module — pour construire la grille
// de cases à cocher côté frontend (une ligne par module, une colonne par action)
exports.getAll = async(req, res) => {
    try {
        const permissions = await permissionsModel.findAll();
        res.json(permissions);
    } catch (err) { sendError(res, err); }
};