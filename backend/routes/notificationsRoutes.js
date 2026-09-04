const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();

// ============================================================
// ROUTES UTILISATEUR CONNECTÉ
// ============================================================

router.get('/', verifyToken, notificationsController.getAll);
router.get('/unread', verifyToken, notificationsController.getUnread);
router.get('/unread/count', verifyToken, notificationsController.getUnreadCount);

router.put('/:id/read', verifyToken, notificationsController.markAsRead);
router.put('/read-all', verifyToken, notificationsController.markAllAsRead);

router.delete('/:id', verifyToken, notificationsController.delete);
router.delete('/', verifyToken, notificationsController.deleteAll);

// ============================================================
// ROUTES ADMIN (super_admin uniquement)
// ============================================================

router.post('/', verifyToken, checkPermission('notifications.create'), notificationsController.create);
router.post('/bulk', verifyToken, checkPermission('notifications.create'), notificationsController.createForUsers);

module.exports = router;