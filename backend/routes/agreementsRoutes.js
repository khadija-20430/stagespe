const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const agreementsController = require('../controllers/agreementsController');
const agreementsModel = require('../models/agreementsModel');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

// Routes publiques
router.get('/', agreementsController.getAll);

// Routes protégées
router.get('/expiring-soon', verifyToken, checkPermission('agreements.view'), agreementsController.getExpiringSoon);
router.get('/:id', agreementsController.getById);

router.post('/', verifyToken, checkPermission('agreements.create'), upload.single('fichier_pdf'), agreementsController.create);

router.put('/:id', verifyToken, checkPermission('agreements.edit'), upload.single('fichier_pdf'), agreementsController.update);

router.delete('/:id', verifyToken, checkPermission('agreements.delete'), agreementsController.remove);

// Routes de publication (Utilisation d'une requête SQL directe pour éviter de modifier partner_id en null)
router.patch('/:id/publish', verifyToken, checkPermission('agreements.edit'), async (req, res) => {
    try {
        // On appelle le modèle update avec seulement le statut
        const agreement = await agreementsModel.update(
            req.params.id, 
            { statut_publication: 'published' }, // Pas de partner_id ici, le modèle le gère maintenant
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