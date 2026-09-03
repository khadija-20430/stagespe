const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const newsEventsController = require('../controllers/newsEventsController');

const router = express.Router();

// upload.fields() : deux champs distincts possibles dans le FormData,
// "image" pour la photo de l'actu et "author_photo" pour la photo de l'auteur.
const newsUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'author_photo', maxCount: 1 },
]);

// =============== ROUTES PUBLIQUES ===============
router.get('/', newsEventsController.getAll);
router.get('/:id', newsEventsController.getOne);

// =============== ROUTES ADMIN ===============
router.get('/admin/all', verifyToken, checkPermission('news_events.view'), newsEventsController.getAllAdmin);
router.get('/:id/translations', verifyToken, checkPermission('news_events.view'), newsEventsController.getTranslations);

// =============== CRUD ===============
router.post('/', verifyToken, checkPermission('news_events.create'), newsUpload, newsEventsController.create);
router.put('/:id', verifyToken, checkPermission('news_events.edit'), newsUpload, newsEventsController.update);
router.delete('/:id', verifyToken, checkPermission('news_events.delete'), newsEventsController.remove);

// =============== PUBLICATION ===============
router.patch('/:id/publish', verifyToken, checkPermission('news_events.edit'), newsEventsController.publish);
router.patch('/:id/archive', verifyToken, checkPermission('news_events.edit'), newsEventsController.archive);
router.put('/:id/restore', verifyToken, checkPermission('news_events.edit'), newsEventsController.restore);

module.exports = router;