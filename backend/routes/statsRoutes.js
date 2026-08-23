const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const statsController = require('../controllers/statsController');

const router = express.Router();

router.get('/', statsController.getBasic);
router.get('/full', verifyToken, checkRole('super_admin', 'admin'), statsController.getFull);

module.exports = router;