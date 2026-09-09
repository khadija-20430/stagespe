const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const schoolPresentationController = require('../controllers/schoolPresentationController');

const router = express.Router();

router.post(
    '/upload',
    verifyToken,
    checkPermission('school_presentation.create'),
    schoolPresentationController.uploadFile
);

// public
router.get('/', schoolPresentationController.getAll);
router.get('/lang/:code', schoolPresentationController.getByLanguage);
router.get('/:id', schoolPresentationController.getById);

// admin
router.get(
    '/admin/all',
    verifyToken,
    checkPermission('school_presentation.view'),
    schoolPresentationController.getAllAdmin
);

router.post(
    '/',
    verifyToken,
    checkPermission('school_presentation.create'),
    upload.single('file'), 
    schoolPresentationController.create
);

router.post(
    '/:id/translations',
    verifyToken,
    checkPermission('school_presentation.edit'),
    upload.single('file'),
    schoolPresentationController.addTranslation
);

router.put(
    '/translations/:translationId',
    verifyToken,
    checkPermission('school_presentation.edit'),
    schoolPresentationController.updateTranslation
);

router.put(
    '/translations/:translationId/file',
    verifyToken,
    checkPermission('school_presentation.edit'),
    upload.single('file'),
    schoolPresentationController.replaceFile
);

router.get(
    '/translations/:translationId/revisions',
    verifyToken,
    checkPermission('school_presentation.view'),
    schoolPresentationController.getRevisions
);

router.patch(
    '/:id/visibilite',
    verifyToken,
    checkPermission('school_presentation.edit'),
    schoolPresentationController.updateVisibilite
);

router.put(
    '/:id/publish',
    verifyToken,
    checkPermission('school_presentation.edit'),
    schoolPresentationController.publish
);

router.put(
    '/:id/archive',
    verifyToken,
    checkPermission('school_presentation.edit'),
    schoolPresentationController.archive
);

router.delete(
    '/:id',
    verifyToken,
    checkPermission('school_presentation.delete'),
    schoolPresentationController.remove
);

router.delete(
    '/translations/:translationId',
    verifyToken,
    checkPermission('school_presentation.delete'),
    schoolPresentationController.removeTranslation
);

module.exports = router;