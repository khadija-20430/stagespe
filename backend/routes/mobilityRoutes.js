const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const mobilityController = require('../controllers/mobilityController');

const router = express.Router();

router.get('/', mobilityController.getAll);
router.get('/admin/all', verifyToken, checkPermission('mobility.view'), mobilityController.getAllAdmin);
router.get('/:id', mobilityController.getOne);
router.get('/admin/all/preview', verifyToken, checkPermission('mobility.view'), mobilityController.getAllAdminPreview);
router.put('/:id/translations', verifyToken, checkPermission('mobility.edit'), mobilityController.updateTranslations);
router.get('/:id/translations', verifyToken, checkPermission('mobility.view'), mobilityController.getTranslations);
router.post('/', verifyToken, checkPermission('mobility.create'), mobilityController.create);
router.put('/:id', verifyToken, checkPermission('mobility.edit'), mobilityController.update);
router.patch('/:id/publish', verifyToken, checkPermission('mobility.publish'), mobilityController.publish);
router.patch('/:id/archive', verifyToken, checkPermission('mobility.publish'), mobilityController.archive);
router.delete('/:id', verifyToken, checkPermission('mobility.delete'), mobilityController.remove);
router.put('/:id/language-requirements', verifyToken, checkPermission('mobility.edit'), mobilityController.updateLanguageRequirements);
module.exports = router;