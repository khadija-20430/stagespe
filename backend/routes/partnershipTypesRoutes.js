const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const partnershipTypesController = require('../controllers/partnershipTypesController');

const router = express.Router();

router.get('/', partnershipTypesController.getAll);
router.post('/', verifyToken, checkPermission('reference_data.manage'), partnershipTypesController.create);
router.put('/:id', verifyToken, checkPermission('reference_data.manage'), partnershipTypesController.update);
router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), partnershipTypesController.remove);

module.exports = router;