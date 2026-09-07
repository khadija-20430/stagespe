const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/programmesController');

const router = express.Router();

// Public
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);

// Admin
router.get('/admin/all', verifyToken, ctrl.getAllAdmin);
router.get('/admin/all/preview', verifyToken, ctrl.getAllAdminPreview);

// Traductions
router.get('/:id/translations', verifyToken, ctrl.getTranslations);
router.put('/:id/translations', verifyToken, ctrl.updateTranslations);

// CRUD
router.post('/', verifyToken, checkPermission('reference_data.manage'), 
  upload.single('logo'), ctrl.create);
router.put('/:id', verifyToken, checkPermission('reference_data.manage'), 
  upload.single('logo'), ctrl.update);
router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), 
  ctrl.remove);

module.exports = router;