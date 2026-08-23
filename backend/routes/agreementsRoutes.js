const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const agreementsController = require('../controllers/agreementsController');

const router = express.Router();

router.get('/', agreementsController.getAll);
router.get('/expiring-soon', verifyToken, checkPermission('agreements.view'), agreementsController.getExpiringSoon);
router.get('/:id', agreementsController.getById);

router.post('/', verifyToken, checkPermission('agreements.create'), upload.single('fichier_pdf'), agreementsController.create);
router.put('/:id', verifyToken, checkPermission('agreements.edit'), upload.single('fichier_pdf'), agreementsController.update);
router.delete('/:id', verifyToken, checkPermission('agreements.delete'), agreementsController.remove);

module.exports = router;