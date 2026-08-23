const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const projectsController = require('../controllers/projectsController');

const router = express.Router();

router.get('/', projectsController.getAll);
router.get('/admin/all', verifyToken, checkPermission('projects.view'), projectsController.getAllAdmin);
router.get('/:id', projectsController.getOne);
router.get('/:id/translations', verifyToken, checkPermission('projects.view'), projectsController.getTranslations);

router.post('/', verifyToken, checkPermission('projects.create'), upload.single('logo'), projectsController.create);
router.put('/:id', verifyToken, checkPermission('projects.edit'), upload.single('logo'), projectsController.update);

router.put('/:id/publish', verifyToken, checkPermission('projects.publish'), projectsController.publish);
router.put('/:id/archive', verifyToken, checkPermission('projects.publish'), projectsController.archive);
router.post('/:id/duplicate', verifyToken, checkPermission('projects.create'), projectsController.duplicate);

router.delete('/:id', verifyToken, checkPermission('projects.delete'), projectsController.remove);

module.exports = router;