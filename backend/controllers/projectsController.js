const projectsModel = require('../models/projectsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { translateList, translateOne, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

function isEndDateBeforeStartDate(start_date, end_date) {
    return start_date && end_date && new Date(end_date) < new Date(start_date);
}

exports.getAll = async(req, res) => {
    try {
        const rows = await projectsModel.findAllPublished(req.query);
        res.json(await translateList('project', rows, req.query.lang));
    } catch (err) { sendError(res, err); }
};

exports.getAllAdmin = async(req, res) => {
    try {
        const rows = await projectsModel.findAllAdmin();
        res.json(rows);
    } catch (err) { sendError(res, err); }
};

exports.getOne = async(req, res) => {
    try {
        const project = await projectsModel.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Projet non trouvé' });

        const [partners, deliverables, results, news, documents] = await Promise.all([
            projectsModel.findPartnersByProject(req.params.id),
            projectsModel.findDeliverablesByProject(req.params.id),
            projectsModel.findResultsByProject(req.params.id),
            projectsModel.findNewsByProject(req.params.id),
            projectsModel.findDocumentsByProject(req.params.id),
        ]);

        res.json({
            ...(await translateOne('project', project, req.query.lang)),
            partners,
            deliverables,
            results,
            news,
            documents,
        });
    } catch (err) { sendError(res, err); }
};

exports.getTranslations = async(req, res) => {
    try {
        res.json(await getAllTranslations('project', req.params.id));
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const { start_date, end_date } = req.body;
        if (isEndDateBeforeStartDate(start_date, end_date)) {
            return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
        }

        const logo_url = req.file ? `/uploads/${req.file.filename}` : null;
        const project = await projectsModel.create({...req.body, logo_url }, req.user.id);

        await logAction(req.user.id, 'create', 'project', project.id, null, req);
        await upsertTranslations('project', project.id, req.body.translations);
        res.status(201).json(project);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const { start_date, end_date } = req.body;
        if (isEndDateBeforeStartDate(start_date, end_date)) {
            return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
        }

        let logo_url = req.body.logo_url || null;
        if (req.file) {
            const existing = await projectsModel.findLogoUrlById(req.params.id);
            if (existing) projectsModel.deleteOldFile(existing.logo_url);
            logo_url = `/uploads/${req.file.filename}`;
        }

        const project = await projectsModel.update(
            req.params.id, {...req.body, logo_url }, { userId: req.user.id, ip: req.ip }
        );
        if (!project) return res.status(404).json({ error: 'Projet non trouvé' });

        await upsertTranslations('project', req.params.id, req.body.translations);
        res.json(project);
    } catch (err) { sendError(res, err); }
};

exports.publish = async(req, res) => {
    try {
        const project = await projectsModel.publish(req.params.id);
        if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
        await logAction(req.user.id, 'publish', 'project', req.params.id, null, req);
        res.json(project);
    } catch (err) { sendError(res, err); }
};

exports.archive = async(req, res) => {
    try {
        const project = await projectsModel.archive(req.params.id);
        if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
        await logAction(req.user.id, 'archive', 'project', req.params.id, null, req);
        res.json(project);
    } catch (err) { sendError(res, err); }
};

exports.duplicate = async(req, res) => {
    try {
        const project = await projectsModel.duplicate(req.params.id, req.user.id);
        if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
        await logAction(req.user.id, 'duplicate', 'project', project.id, { source_id: req.params.id }, req);
        res.status(201).json(project);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const existing = await projectsModel.findLogoUrlById(req.params.id);
        const project = await projectsModel.remove(req.params.id);
        if (!project) return res.status(404).json({ error: 'Projet non trouvé' });
        if (existing) projectsModel.deleteOldFile(existing.logo_url);
        await deleteTranslations('project', req.params.id);
        await logAction(req.user.id, 'delete', 'project', req.params.id, null, req);
        res.json({ message: 'Projet supprimé', deleted: project });
    } catch (err) { sendError(res, err); }
};