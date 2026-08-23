const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();

router.get('/', verifyToken, notificationsController.getAll);
router.put('/:id/read', verifyToken, notificationsController.markAsRead);
router.put('/read-all', verifyToken, notificationsController.markAllAsRead);
router.post('/', verifyToken, notificationsController.create);

module.exports = router;