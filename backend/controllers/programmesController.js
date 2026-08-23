const programmesModel = require('../models/programmesModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const programmes = await programmesModel.findAll();
        res.json(programmes);
    } catch (err) { sendError(res, err); }
};

exports.getOne = async(req, res) => {
    try {
        const programme = await programmesModel.findById(req.params.id);
        if (!programme) return res.status(404).json({ error: 'Programme non trouvé' });
        res.json(programme);
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const logo_url = req.file ? `/uploads/${req.file.filename}` : null;
        const programme = await programmesModel.create({...req.body, logo_url });
        res.status(201).json(programme);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        let logo_url = req.body.logo_url || null;

        if (req.file) {
            const existing = await programmesModel.findLogoUrlById(req.params.id);
            if (existing) programmesModel.deleteOldLogoFile(existing.logo_url);
            logo_url = `/uploads/${req.file.filename}`;
        }

        const programme = await programmesModel.update(req.params.id, {...req.body, logo_url });
        if (!programme) return res.status(404).json({ error: 'Programme non trouvé' });
        res.json(programme);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const existing = await programmesModel.findLogoUrlById(req.params.id);
        const programme = await programmesModel.remove(req.params.id);
        if (!programme) return res.status(404).json({ error: 'Programme non trouvé' });
        if (existing) programmesModel.deleteOldLogoFile(existing.logo_url);
        res.json({ message: 'Programme supprimé' });
    } catch (err) { sendError(res, err); }
};