const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const mobilityController = require('../controllers/mobilityController');

const router = express.Router();

router.get('/', mobilityController.getAll);
router.get('/admin/all', verifyToken, checkPermission('mobility.view'), mobilityController.getAllAdmin);
router.get('/:id', mobilityController.getOne);
router.get('/:id/translations', verifyToken, checkPermission('mobility.view'), mobilityController.getTranslations);
router.post('/', verifyToken, checkPermission('mobility.create'), mobilityController.create);
router.put('/:id', verifyToken, checkPermission('mobility.edit'), mobilityController.update);
router.put('/:id/publish', verifyToken, checkPermission('mobility.publish'), mobilityController.publish);
router.put('/:id/archive', verifyToken, checkPermission('mobility.publish'), mobilityController.archive);
router.delete('/:id', verifyToken, checkPermission('mobility.delete'), mobilityController.remove);

module.exports = router;