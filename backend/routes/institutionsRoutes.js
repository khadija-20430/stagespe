const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const institutionsController = require('../controllers/institutionsController');

const router = express.Router();

router.get('/', institutionsController.getAll);
router.post('/', verifyToken, checkPermission('reference_data.manage'), institutionsController.create);
router.put('/:id', verifyToken, checkPermission('reference_data.manage'), institutionsController.update);
router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), institutionsController.remove);

module.exports = router;