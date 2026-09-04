const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');
const agreementsController = require('../controllers/agreementsController');
const agreementsModel = require('../models/agreementsModel');
const sendError = require('../middleware/errorResponse');

const router = express.Router();

// ============================================================
// NOTE : ce routeur est supposé monté ainsi dans server.js :
//   app.use('/api/agreements', agreementsRoutes);
// (même convention que /api/projects, /api/calls, /api/mobility...)
// Tous les chemins ci-dessous sont donc RELATIFS à '/agreements'.
// Si ton server.js monte ce routeur autrement (ex: app.use('/api', ...)),
// dis-le-moi et j'ajuste les chemins en conséquence.
// ============================================================

// ------------------------------------------------------------
// Routes publiques
// ------------------------------------------------------------
router.get('/', agreementsController.getPublic);
router.get('/:id', agreementsController.getById);

// ------------------------------------------------------------
// Routes protégées — admin
// ------------------------------------------------------------
router.get('/admin/all', verifyToken, checkPermission('agreements.view'), agreementsController.getAdmin);
router.get('/expiring-soon', verifyToken, checkPermission('agreements.view'), agreementsController.getExpiringSoon);

router.post('/', verifyToken, checkPermission('agreements.create'), upload.single('fichier_pdf'), agreementsController.create);
router.put('/:id', verifyToken, checkPermission('agreements.edit'), upload.single('fichier_pdf'), agreementsController.update);
router.delete('/:id', verifyToken, checkPermission('agreements.delete'), agreementsController.remove);

// ------------------------------------------------------------
// Publication (requête directe via le modèle, statut_publication uniquement)
// ------------------------------------------------------------
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