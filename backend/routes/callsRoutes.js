const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const callsController = require('../controllers/callsController');

const router = express.Router();

router.get('/', callsController.getAllPublished);
router.get('/admin/all', verifyToken, checkPermission('calls.view'), callsController.getAllAdmin);
router.get('/closing-soon', verifyToken, checkPermission('calls.view'), callsController.getClosingSoon);
router.get('/:id', callsController.getById);
router.get('/:id/translations', verifyToken, checkPermission('calls.view'), callsController.getTranslations);

router.post('/', verifyToken, checkPermission('calls.create'), callsController.create);
router.put('/:id', verifyToken, checkPermission('calls.edit'), callsController.update);
router.put('/:id/publish', verifyToken, checkPermission('calls.publish'), callsController.publish);
router.put('/:id/archive', verifyToken, checkPermission('calls.publish'), callsController.archive);
router.delete('/:id', verifyToken, checkPermission('calls.delete'), callsController.remove);

module.exports = router;