const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const actionTypesController = require('../controllers/actionTypesController');

const router = express.Router();

router.get('/', actionTypesController.getAll);
router.post('/', verifyToken, checkPermission('reference_data.manage'), actionTypesController.create);
router.put('/:id', verifyToken, checkPermission('reference_data.manage'), actionTypesController.update);
router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), actionTypesController.remove);

module.exports = router;