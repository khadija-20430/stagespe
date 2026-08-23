const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const partnerContactsController = require('../controllers/partnerContactsController');

const router = express.Router();

router.get('/partner/:partnerId', partnerContactsController.getPublicByPartner);
router.get('/partner/:partnerId/all', verifyToken, checkPermission('partners.view'), partnerContactsController.getAllByPartner);
router.post('/', verifyToken, checkPermission('partners.edit'), partnerContactsController.create);
router.put('/:id', verifyToken, checkPermission('partners.edit'), partnerContactsController.update);
router.delete('/:id', verifyToken, checkPermission('partners.edit'), partnerContactsController.remove);

module.exports = router;