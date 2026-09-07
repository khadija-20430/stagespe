const express = require('express');
const controller = require('../controllers/homeSlidesController');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');

const router = express.Router();

// Public
router.get('/', controller.getPublic);

// Admin
router.get('/admin/all', verifyToken, checkPermission('reference_data.manage'), controller.getAllAdmin);
router.post('/', verifyToken, checkPermission('reference_data.manage'), controller.create);
router.put('/:id', verifyToken, checkPermission('reference_data.manage'), controller.update);
router.put('/:id/status', verifyToken, checkPermission('reference_data.manage'), controller.updateStatus);
router.put('/reorder', verifyToken, checkPermission('reference_data.manage'), controller.reorder);
router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), controller.delete);
router.get('/:id/translations', verifyToken, checkPermission('reference_data.manage'), controller.getTranslations);

module.exports = router;