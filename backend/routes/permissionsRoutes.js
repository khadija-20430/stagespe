const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const permissionsController = require('../controllers/permissionsController');

const router = express.Router();

router.get('/', verifyToken, checkRole('super_admin'), permissionsController.getAll);

module.exports = router;