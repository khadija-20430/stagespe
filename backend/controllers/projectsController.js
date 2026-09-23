const projectsModel = require('../models/projectsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const pool = require('../db'); 
const { uploadToSupabase } = require('../utils/storage'); // en haut du fichier

const { translateList, translateOne, translateRelatedField, autoTranslateAndSave, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

function isEndDateBeforeStartDate(start_date, end_date) {
    return start_date && end_date && new Date(end_date) < new Date(start_date);
}

// public
exports.getAll = async(req, res) => {
    try {
        const rows = await projectsModel.findAllPublished(req.query);
        const translated = await translateList('project', rows, req.query.lang);
        const withCoordinator = await translateRelatedField(translated, req.query.lang, {
            entityType: 'partner', idField: 'coordinator_partner_id', nameField: 'coordinator_partner_name',
        });
        res.json(withCoordinator);
    } catch (err) { sendError(res, err); }
};

// admin
exports.getAllAdmin = async(req, res) => {
    try {
        const rows = await projectsModel.findAllAdmin();
        res.json(rows);
    } catch (err) { sendError(res, err); }
};

exports.getAllAdminPreview = async(req, res) => {
    try {
        const rows = await projectsModel.findAllAdmin();
        const translated = await translateList('project', rows, req.query.lang);
        res.json(translated);
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

        const translated = await translateOne('project', project, req.query.lang);
        const [withCoordinator] = await translateRelatedField([translated], req.query.lang, {
            entityType: 'partner', idField: 'coordinator_partner_id', nameField: 'coordinator_partner_name',
        });

        res.json({
            ...withCoordinator,
            partners,
            deliverables,
            results,
            news,
            documents,
        });
    } catch (err) { sendError(res, err); }
};

//traductions
exports.getTranslations = async(req, res) => {
    try {
        res.json(await getAllTranslations('project', req.params.id));
    } catch (err) { sendError(res, err); }
};

exports.updateTranslations = async(req, res) => {
    try {
        await upsertTranslations('project', req.params.id, req.body);
        const updated = await getAllTranslations('project', req.params.id);
        res.json(updated);
    } catch (err) { sendError(res, err); }
};

// creation d un projet
exports.create = async(req, res) => {
    try {
        const { start_date, end_date } = req.body;
        if (isEndDateBeforeStartDate(start_date, end_date)) {
            return res.status(400).json({ error: 'La date de fin ne peut pas être antérieure à la date de début' });
        }

const logo_url = req.file ? await uploadToSupabase(req.file) : null;       
        const project = await projectsModel.create({...req.body, logo_url }, req.user.id);

        await logAction(req.user.id, 'create', 'project', project.id, null, req);
        await autoTranslateAndSave('project', project.id, req.body);
        res.status(201).json(project);
    } catch (err) { sendError(res, err); }
};
// mise a jour d un projet
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
logo_url = await uploadToSupabase(req.file);        }

        const project = await projectsModel.update(
            req.params.id, {...req.body, logo_url }, { userId: req.user.id, ip: req.ip }
        );
        if (!project) return res.status(404).json({ error: 'Projet non trouvé' });

        await autoTranslateAndSave('project', req.params.id, req.body);
        res.json(project);
    } catch (err) { sendError(res, err); }
};
// publication status
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
// suppression d un projet
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

// mise a jour des traductions delivrables

exports.updateDeliverablesTranslations = async (req, res) => {
    const { id } = req.params;
    const { deliverables = [], results = [] } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const d of deliverables) {
            if (!d.id) continue;
            await projectsModel.replaceDeliverableTranslations(client, d.id, d.translations);
        }

        for (const r of results) {
            if (!r.id) continue;
            await projectsModel.replaceResultTranslations(client, r.id, r.translations);
        }

        await client.query('COMMIT');
        res.json({ message: 'Traductions mises à jour' });
    } catch (err) {
        await client.query('ROLLBACK');
        sendError(res, err);
    } finally {
        client.release();
    }
};