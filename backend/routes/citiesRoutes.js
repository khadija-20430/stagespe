const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const citiesController = require('../controllers/citiesController');

const router = express.Router();

router.get('/', citiesController.getAll);
router.post('/', verifyToken, checkPermission('reference_data.manage'), citiesController.create);
router.put('/:id', verifyToken, checkPermission('reference_data.manage'), citiesController.update);
router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), citiesController.remove);

module.exports = router;