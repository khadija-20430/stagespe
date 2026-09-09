const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const countriesController = require('../controllers/countriesController');

const router = express.Router();

router.get('/', countriesController.getAll);
router.post('/', verifyToken, checkPermission('reference_data.manage'), countriesController.create);

router.get('/:id/translations', verifyToken, checkPermission('reference_data.manage'), countriesController.getTranslations);
router.put('/:id/translations', verifyToken, checkPermission('reference_data.manage'), countriesController.updateTranslations);

module.exports = router;