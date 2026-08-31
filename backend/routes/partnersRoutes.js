const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const partnersController = require('../controllers/partnersController');

const router = express.Router();

router.get('/', partnersController.getAll);
router.get('/map', partnersController.getForMap);
router.get('/admin/all', verifyToken, checkPermission('partners.view'), partnersController.getAllAdmin);
router.get('/:id', partnersController.getOne);
router.get('/:id/translations', verifyToken, checkPermission('partners.view'), partnersController.getTranslations);

router.post('/', verifyToken, checkPermission('partners.create'), upload.single('logo'), partnersController.create);
router.put('/:id', verifyToken, checkPermission('partners.edit'), upload.single('logo'), partnersController.update);

router.patch('/:id/publish', verifyToken, checkPermission('partners.publish'), partnersController.publish);
router.patch('/:id/archive', verifyToken, checkPermission('partners.publish'), partnersController.archive);
router.post('/:id/duplicate', verifyToken, checkPermission('partners.create'), partnersController.duplicate);

router.delete('/:id', verifyToken, checkPermission('partners.delete'), partnersController.remove);

module.exports = router;