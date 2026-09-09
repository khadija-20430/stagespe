const notificationsModel = require('../models/notificationsModel');
const authModel = require('../models/authModel');
const sendError = require('../middleware/errorResponse');
const logAction = require('../middleware/auditLog');

// Recuperer toutes les notifs d un utilisateur
exports.getAll = async (req, res) => {
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

// Recuperer toutes les notifs (admin)
exports.getAllAdmin = async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;
        const notifications = await notificationsModel.findAll(
            parseInt(limit),
            parseInt(offset)
        );
        res.json(notifications);
    } catch (err) {
        sendError(res, err);
    }
};

// Recuperer uniquement les notifications non lues
exports.getUnread = async (req, res) => {
    try {
        const notifications = await notificationsModel.findUnreadByUser(req.user.id);
        res.json(notifications);
    } catch (err) {
        sendError(res, err);
    }
};

// Recuperer le nbr de notifs non lu
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await notificationsModel.countUnreadByUser(req.user.id);
        res.json({ count });
    } catch (err) {
        sendError(res, err);
    }
};

// Creer une notif pour un user
exports.create = async (req, res) => {
    try {
        const { user_id, title, message, type = 'info', link = null } = req.body;

        if (!user_id || !title || !message) {
            return res.status(400).json({
                error: 'user_id, title et message sont obligatoires'
            });
        }

        const notification = await notificationsModel.create({
            user_id,
            title,
            message,
            type,
            link
        });

        await logAction(req.user.id, 'create', 'notification', notification.id, { user_id, title }, req);
        res.status(201).json(notification);

    } catch (err) {
        sendError(res, err);
    }
};

//creer notif pour plusieurs users
exports.createForUsers = async (req, res) => {
    try {
        const { userIds, title, message, type = 'info', link = null } = req.body;

        if (!userIds || userIds.length === 0 || !title || !message) {
            return res.status(400).json({
                error: 'userIds, title et message sont obligatoires'
            });
        }

        const notifications = await notificationsModel.createForUsers(
            userIds,
            title,
            message,
            type,
            link
        );

        await logAction(req.user.id, 'create_bulk', 'notification', null, { 
            count: notifications.length,
            title 
        }, req);

        res.status(201).json({
            message: `${notifications.length} notifications créées`,
            count: notifications.length,
            notifications
        });

    } catch (err) {
        sendError(res, err);
    }
};

// Creer notif pour un role
exports.createByRole = async (req, res) => {
    try {
        const { role_id, title, message, type = 'info', link = null } = req.body;

        if (!role_id || !title || !message) {
            return res.status(400).json({
                error: 'role_id, title et message sont obligatoires'
            });
        }
        const roleExists = await authModel.roleExists(role_id);
        if (!roleExists) {
            return res.status(404).json({ error: 'Rôle RBAC non trouvé' });
        }
        const roleInfo = await authModel.findRoleById(role_id);
        const roleName = roleInfo?.name || 'Rôle inconnu';
        const users = await authModel.findUsersByRoleId(role_id);

        if (users.length === 0) {
            return res.status(404).json({
                error: `Aucun utilisateur trouvé avec le rôle "${roleName}"`
            });
        }
        const userIds = users.map(u => u.id);
        const notifications = await notificationsModel.createForUsers(
            userIds,
            title,
            message,
            type,
            link
        );

        await logAction(req.user.id, 'create_bulk', 'notification', null, {
            role_id,
            role_name: roleName,
            count: notifications.length,
            title
        }, req);

        res.status(201).json({
            message: `${notifications.length} notifications envoyées aux utilisateurs du rôle "${roleName}"`,
            count: notifications.length,
            role_name: roleName,
            notifications
        });

    } catch (err) {
        sendError(res, err);
    }
};

// Marquer une notif comme lue
exports.markAsRead = async (req, res) => {
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

// marquer toutes les notifs comme lues
exports.markAllAsRead = async (req, res) => {
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

// Supprimer une notif
exports.delete = async (req, res) => {
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

// Supprimer toutes les notifs d un user
exports.deleteAll = async (req, res) => {
    try {
        const notifications = await notificationsModel.deleteAll(req.user.id);
        await logAction(req.user.id, 'delete_all', 'notification', null, { count: notifications.length }, req);
        res.json({
            message: 'Toutes les notifications supprimées',
            count: notifications.length
        });
    } catch (err) {
        sendError(res, err);
    }
};

exports.deleteAllByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await notificationsModel.deleteAll(userId);
        await logAction(req.user.id, 'delete_all', 'notification', null, { 
            user_id: userId,
            count: notifications.length 
        }, req);
        res.json({
            message: `Toutes les notifications de l'utilisateur supprimées`,
            count: notifications.length
        });
    } catch (err) {
        sendError(res, err);
    }
};

module.exports = exports;