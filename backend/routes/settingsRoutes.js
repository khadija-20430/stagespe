const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

router.get('/', verifyToken, checkRole('super_admin'), settingsController.getSettings);
router.put('/', verifyToken, checkRole('super_admin'), settingsController.updateSettings);

module.exports = router;