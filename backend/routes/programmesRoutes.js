const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const programmesController = require('../controllers/programmesController');

const router = express.Router();

router.get('/', programmesController.getAll);
router.get('/:id', programmesController.getOne);
router.post('/', verifyToken, checkPermission('reference_data.manage'), upload.single('logo'), programmesController.create);
router.put('/:id', verifyToken, checkPermission('reference_data.manage'), upload.single('logo'), programmesController.update);
router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), programmesController.remove);

module.exports = router;