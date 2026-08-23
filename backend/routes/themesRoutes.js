const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const themesController = require('../controllers/themesController');

const router = express.Router();

router.get('/', themesController.getAll);
router.post('/', verifyToken, checkPermission('reference_data.manage'), themesController.create);
router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), themesController.remove);

module.exports = router;