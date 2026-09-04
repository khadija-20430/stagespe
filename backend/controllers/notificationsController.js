const notificationsModel = require('../models/notificationsModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

// ============================================================
// RÉCUPÉRER TOUTES LES NOTIFICATIONS
// ============================================================

exports.getAll = async(req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const notifications = await notificationsModel.findAllByUser(
            req.user.id,
            parseInt(limit),
            parseInt(offset)
        );
        res.json(notifications);
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// RÉCUPÉRER LES NOTIFICATIONS NON LUES
// ============================================================

exports.getUnread = async(req, res) => {
    try {
        const notifications = await notificationsModel.findUnreadByUser(req.user.id);
        res.json(notifications);
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// RÉCUPÉRER LE NOMBRE DE NOTIFICATIONS NON LUES
// ============================================================

exports.getUnreadCount = async(req, res) => {
    try {
        const count = await notificationsModel.countUnreadByUser(req.user.id);
        res.json({ count });
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// MARQUER COMME LUE
// ============================================================

exports.markAsRead = async(req, res) => {
    try {
        const notification = await notificationsModel.markAsRead(req.params.id, req.user.id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification non trouvée' });
        }
        res.json(notification);
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// MARQUER TOUTES COMME LUES
// ============================================================

exports.markAllAsRead = async(req, res) => {
    try {
        const notifications = await notificationsModel.markAllAsRead(req.user.id);
        res.json({
            message: 'Toutes les notifications ont été marquées comme lues',
            count: notifications.length
        });
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// CRÉER UNE NOTIFICATION (POUR UN UTILISATEUR SPÉCIFIQUE)
// ============================================================

exports.create = async(req, res) => {
    try {
        const { user_id, title, message, type, link } = req.body;

        if (!user_id || !title || !message) {
            return res.status(400).json({
                error: 'user_id, title et message sont obligatoires'
            });
        }

        const notification = await notificationsModel.create({
            user_id,
            title,
            message,
            type: type || 'info',
            link
        });

        await logAction(req.user.id, 'create', 'notification', notification.id, null, req);
        res.status(201).json(notification);
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// SUPPRIMER UNE NOTIFICATION
// ============================================================

exports.delete = async(req, res) => {
    try {
        const notification = await notificationsModel.delete(req.params.id, req.user.id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification non trouvée' });
        }
        await logAction(req.user.id, 'delete', 'notification', req.params.id, null, req);
        res.json({ message: 'Notification supprimée' });
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// SUPPRIMER TOUTES LES NOTIFICATIONS
// ============================================================

exports.deleteAll = async(req, res) => {
    try {
        const notifications = await notificationsModel.deleteAll(req.user.id);
        await logAction(req.user.id, 'delete_all', 'notification', null, null, req);
        res.json({
            message: 'Toutes les notifications supprimées',
            count: notifications.length
        });
    } catch (err) {
        sendError(res, err);
    }
};

// ============================================================
// ADMIN : CRÉER POUR PLUSIEURS UTILISATEURS
// ============================================================

exports.createForUsers = async(req, res) => {
    try {
        const { userIds, title, message, type = 'info', link = null } = req.body;

        if (!userIds || userIds.length === 0 || !title || !message) {
            return res.status(400).json({
                error: 'userIds, title et message sont obligatoires'
            });
        }

        const notifications = await notificationsModel.createForUsers(
            userIds, title, message, type, link
        );

        await logAction(req.user.id, 'create_bulk', 'notification', null, { count: notifications.length }, req);

        res.status(201).json(notifications);
    } catch (err) {
        sendError(res, err);
    }
};

module.exports = exports;