const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const documentsController = require('../controllers/documentsController');

const router = express.Router();

router.post('/upload', verifyToken, checkPermission('documents.upload'), documentsController.uploadFile);

router.get('/', documentsController.getAllPublic);
router.get('/admin/all', verifyToken, checkPermission('documents.view'), documentsController.getAllAdmin);
router.get('/admin/all/preview', verifyToken, checkPermission('documents.view'), documentsController.getAllAdminPreview);
router.get('/expired', verifyToken, checkPermission('documents.view'), documentsController.getExpired);
router.get('/:id', documentsController.getById);
router.get('/:id/download', documentsController.download);
router.get('/:id/revisions', verifyToken, checkPermission('documents.view'), documentsController.getRevisions);
router.get('/:id/translations', verifyToken, checkPermission('documents.view'), documentsController.getTranslations);
router.put('/:id/translations', verifyToken, checkPermission('documents.edit'), documentsController.updateTranslations);

router.post('/', verifyToken, checkPermission('documents.upload'), documentsController.create);
router.post('/:id/link', verifyToken, checkPermission('documents.edit'), documentsController.createLink);
router.delete('/:id/link', verifyToken, checkPermission('documents.edit'), documentsController.removeLink);
router.put('/:id', verifyToken, checkPermission('documents.edit'), documentsController.update);
router.put('/:id/publish', verifyToken, checkPermission('documents.edit'), documentsController.publish);
router.put('/:id/archive', verifyToken, checkPermission('documents.edit'), documentsController.archive);
router.delete('/:id', verifyToken, checkPermission('documents.delete'), documentsController.remove);

module.exports = router;