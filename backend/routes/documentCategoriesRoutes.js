const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const documentCategoriesController = require('../controllers/documentCategoriesController');

const router = express.Router();

router.get('/', documentCategoriesController.getAll);
router.post('/', verifyToken, checkPermission('reference_data.manage'), documentCategoriesController.create);
router.put('/:id', verifyToken, checkPermission('reference_data.manage'), documentCategoriesController.update);
router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), documentCategoriesController.remove);

module.exports = router;