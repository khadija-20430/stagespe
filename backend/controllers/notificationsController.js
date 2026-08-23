const notificationsModel = require('../models/notificationsModel');
const sendError = require('../middleware/errorResponse');

exports.getAll = async(req, res) => {
    try {
        const notifications = await notificationsModel.findAllByUser(req.user.id);
        res.json(notifications);
    } catch (err) { sendError(res, err); }
};

exports.markAsRead = async(req, res) => {
    try {
        const notification = await notificationsModel.markAsRead(req.params.id, req.user.id);
        if (!notification) return res.status(404).json({ error: 'Notification non trouvée' });
        res.json(notification);
    } catch (err) { sendError(res, err); }
};

exports.markAllAsRead = async(req, res) => {
    try {
        await notificationsModel.markAllAsRead(req.user.id);
        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (err) { sendError(res, err); }
};

exports.create = async(req, res) => {
    try {
        const notification = await notificationsModel.create(req.body);
        res.status(201).json(notification);
    } catch (err) { sendError(res, err); }
};