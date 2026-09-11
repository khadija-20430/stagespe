const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();

router.get('/me', verifyToken, notificationsController.getAll);

router.get('/me/unread', verifyToken, notificationsController.getUnread);

router.get('/me/unread-count', verifyToken, notificationsController.getUnreadCount);

router.put('/me/read-all', verifyToken, notificationsController.markAllAsRead);

router.put('/:id/read', verifyToken, notificationsController.markAsRead);

router.delete('/:id', verifyToken, notificationsController.delete);

router.delete('/me/all', verifyToken, notificationsController.deleteAll);


router.get('/admin/all', verifyToken, checkRole('super_admin'), notificationsController.getAllAdmin);

router.post('/admin', verifyToken, checkRole('super_admin'), notificationsController.create);

router.post('/admin/bulk', verifyToken, checkRole('super_admin'), notificationsController.createForUsers);

router.post('/admin/by-role', verifyToken, checkRole('super_admin'), notificationsController.createByRole);

router.delete('/admin/user/:userId/all', verifyToken, checkRole('super_admin'), notificationsController.deleteAllByUser);


module.exports = router;