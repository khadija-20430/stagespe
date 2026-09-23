const newsEventsModel = require('../models/newsEventsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');
const { uploadToSupabase } = require('../utils/storage'); // en haut du fichier
const { translateList, translateOne, autoTranslateAndSave, upsertTranslations, getAllTranslations, deleteTranslations } = require('../lib/i18n');

function isInvalidTestimonial(type, author_name, quote_text) {
    return type === 'testimonial' && (!author_name || !quote_text);
}

// public
exports.getAll = async(req, res) => {
    try {
        const rows = await newsEventsModel.findAllPublished(req.query);
        res.json(await translateList('news', rows, req.query.lang));
    } catch (err) { sendError(res, err); }
};

exports.getOne = async(req, res) => {
    try {
        const item = await newsEventsModel.findPublishedById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Contenu non trouvé' });
        res.json(await translateOne('news', item, req.query.lang));
    } catch (err) { sendError(res, err); }
};

// admin
exports.getAllAdmin = async(req, res) => {
    try {
        const rows = await newsEventsModel.findAllAdmin();
        res.json(rows);
    } catch (err) { sendError(res, err); }
};

exports.getAllAdminPreview = async(req, res) => {
    try {
        const rows = await newsEventsModel.findAllAdmin();
        const translated = await translateList('news', rows, req.query.lang);
        res.json(translated);
    } catch (err) { sendError(res, err); }
};

exports.getTranslations = async(req, res) => {
    try {
        res.json(await getAllTranslations('news', req.params.id));
    } catch (err) { sendError(res, err); }
};

exports.updateTranslations = async(req, res) => {
    try {
        await upsertTranslations('news', req.params.id, req.body);
        const updated = await getAllTranslations('news', req.params.id);
        res.json(updated);
    } catch (err) { sendError(res, err); }
};

// crud
exports.create = async(req, res) => {
    try {
        const {
            title,
            type,
            summary,
            description,
            project_id,
            event_date,
            end_date,
            location,
            is_featured,
            author_name,
            author_role,
            quote_text,
            statut_publication,
            scheduled_publish_at,  
        } = req.body;

        if (isInvalidTestimonial(type, author_name, quote_text)) {
            return res.status(400).json({ error: 'Un témoignage nécessite un auteur et une citation' });
        }

       const image_url = req.files?.image ? await uploadToSupabase(req.files.image[0]) : null;
       const author_photo_url = req.files?.author_photo ? await uploadToSupabase(req.files.author_photo[0]) : null;
        const news = await newsEventsModel.create({
            title,
            type,
            summary,
            description,
            project_id,
            event_date,
            end_date,
            location,
            image_url,
            is_featured,
            author_name,
            author_role,
            author_photo_url,
            quote_text,
            statut_publication,
            scheduled_publish_at, 
        }, req.user.id);

        await logAction(req.user.id, 'create', 'news_event', news.id, null, req);
        await autoTranslateAndSave('news', news.id, req.body);
        res.status(201).json(news);
    } catch (err) { sendError(res, err); }
};

exports.update = async(req, res) => {
    try {
        const {
            title,
            type,
            summary,
            description,
            project_id,
            event_date,
            end_date,
            location,
            is_featured,
            author_name,
            author_role,
            quote_text,
            statut_publication,
            scheduled_publish_at,  
        } = req.body;

        if (isInvalidTestimonial(type, author_name, quote_text)) {
            return res.status(400).json({ error: 'Un témoignage nécessite un auteur et une citation' });
        }

        const existing = await newsEventsModel.findFilesById(req.params.id);

        let image_url = req.body.image_url || null;
        if (req.files?.image) {
    if (existing) newsEventsModel.deleteOldFile(existing.image_url);
    image_url = await uploadToSupabase(req.files.image[0]);
}

        let author_photo_url = req.body.author_photo_url || null;
       if (req.files?.author_photo) {
    if (existing) newsEventsModel.deleteOldFile(existing.author_photo_url);
    author_photo_url = await uploadToSupabase(req.files.author_photo[0]);
}

        const news = await newsEventsModel.update(req.params.id, {
            title,
            type,
            summary,
            description,
            project_id,
            event_date,
            end_date,
            location,
            image_url,
            is_featured,
            author_name,
            author_role,
            author_photo_url,
            quote_text,
            statut_publication,
            scheduled_publish_at,  
        });
        if (!news) return res.status(404).json({ error: 'Contenu non trouvé' });

        await logAction(req.user.id, statut_publication === 'published' ? 'publish' : 'update', 'news_event', req.params.id, null, req);
        await autoTranslateAndSave('news', req.params.id, req.body);
        res.json(news);
    } catch (err) { sendError(res, err); }
};

exports.remove = async(req, res) => {
    try {
        const existing = await newsEventsModel.findFilesById(req.params.id);
        const news = await newsEventsModel.remove(req.params.id);
        if (!news) return res.status(404).json({ error: 'Contenu non trouvé' });

        if (existing) {
            newsEventsModel.deleteOldFile(existing.image_url);
            newsEventsModel.deleteOldFile(existing.author_photo_url);
        }
        await deleteTranslations('news', req.params.id);
        await logAction(req.user.id, 'delete', 'news_event', req.params.id, null, req);
        res.json({ message: 'Contenu supprimé', deleted: news });
    } catch (err) { sendError(res, err); }
};

// status publication
exports.publish = async(req, res) => {
    try {
        const news = await newsEventsModel.publish(req.params.id);
        if (!news) return res.status(404).json({ error: 'Actualité non trouvée' });
        await logAction(req.user.id, 'publish', 'news_event', req.params.id, null, req);
        res.json(news);
    } catch (err) {
        console.error('❌ Erreur publication:', err);
        res.status(500).json({ error: 'Erreur lors de la publication' });
    }
};

exports.archive = async(req, res) => {
    try {
        const news = await newsEventsModel.archive(req.params.id);
        if (!news) return res.status(404).json({ error: 'Actualité non trouvée' });
        await logAction(req.user.id, 'archive', 'news_event', req.params.id, null, req);
        res.json(news);
    } catch (err) {
        console.error('❌ Erreur archivage:', err);
        res.status(500).json({ error: 'Erreur lors de l\'archivage' });
    }
};

exports.restore = async(req, res) => {
    try {
        const news = await newsEventsModel.restore(req.params.id);
        if (!news) return res.status(404).json({ error: 'Actualité non trouvée' });
        res.json(news);
    } catch (err) {
        console.error('❌ Erreur restauration:', err);
        res.status(500).json({ error: 'Erreur lors de la restauration' });
    }
};