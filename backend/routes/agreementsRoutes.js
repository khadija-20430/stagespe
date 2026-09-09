const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const agreementsController = require('../controllers/agreementsController');
const agreementsModel = require('../models/agreementsModel');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

router.get('/', agreementsController.getPublic);
router.get('/admin/all', verifyToken, checkPermission('agreements.view'), agreementsController.getAdmin);
router.get('/admin/all/preview', verifyToken, checkPermission('agreements.view'), agreementsController.getAllAdminPreview);
router.get('/expiring-soon', verifyToken, checkPermission('agreements.view'), agreementsController.getExpiringSoon);
router.get('/:id', agreementsController.getById);
router.get('/:id/translations', verifyToken, checkPermission('agreements.view'), agreementsController.getTranslations);
router.put('/:id/translations', verifyToken, checkPermission('agreements.edit'), agreementsController.updateTranslations);
router.post('/', verifyToken, checkPermission('agreements.create'), upload.single('fichier_pdf'), agreementsController.create);
router.put('/:id', verifyToken, checkPermission('agreements.edit'), upload.single('fichier_pdf'), agreementsController.update);
router.delete('/:id', verifyToken, checkPermission('agreements.delete'), agreementsController.remove);
router.patch('/:id/publish', verifyToken, checkPermission('agreements.edit'), async (req, res) => {
    try {
        const agreement = await agreementsModel.update(
            req.params.id,
            { statut_publication: 'published' },
            req.user.id,
            req.ip
        );
        if (!agreement) {
            return res.status(404).json({ error: 'Accord non trouvé' });
        }
        res.json(agreement);
    } catch (err) {
        console.error('Publish error:', err);
        sendError(res, err);
    }
});

router.patch('/:id/archive', verifyToken, checkPermission('agreements.edit'), async (req, res) => {
    try {
        const agreement = await agreementsModel.update(
            req.params.id,
            { statut_publication: 'archived' },
            req.user.id,
            req.ip
        );
        if (!agreement) {
            return res.status(404).json({ error: 'Accord non trouvé' });
        }
        res.json(agreement);
    } catch (err) {
        console.error('Archive error:', err);
        sendError(res, err);
    }
});

module.exports = router;