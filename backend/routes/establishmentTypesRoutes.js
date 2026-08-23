const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const establishmentTypesController = require('../controllers/establishmentTypesController');

const router = express.Router();

router.get('/', establishmentTypesController.getAll);
router.post('/', verifyToken, checkPermission('reference_data.manage'), establishmentTypesController.create);
router.put('/:id', verifyToken, checkPermission('reference_data.manage'), establishmentTypesController.update);
router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), establishmentTypesController.remove);

module.exports = router;