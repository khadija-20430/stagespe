const projectPartnersModel = require('../models/projectPartnersModel');
const sendError = require('../middleware/errorResponse');

exports.getAllByProject = async(req, res) => {
    try {
        const links = await projectPartnersModel.findAllByProject(req.params.projectId);
        res.json(links);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        if (!req.body.role) return res.status(400).json({ error: 'Le rôle du partenaire dans le projet est requis' });
        const link = await projectPartnersModel.create(req.body);
        res.status(201).json(link);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const link = await projectPartnersModel.remove(req.params.id);
        if (!link) return res.status(404).json({ error: 'Lien non trouvé' });
        res.json({ message: 'Lien supprimé' });
    } catch (err) { sendError(res, err); }
};