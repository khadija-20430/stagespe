const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const themesController = require('../controllers/themesController');
const themesModel = require('../models/themesModel');

const router = express.Router();

// Public
router.get('/', async (req, res) => {
  try {
    const lang = req.query.lang || 'fr';
    const themes = await themesModel.findAllByLanguage(lang);
    res.json(themes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin 
router.post('/', verifyToken, checkPermission('reference_data.manage'), themesController.create);
router.delete('/:id', verifyToken, checkPermission('reference_data.manage'), themesController.remove);

// Admin 
router.get('/:id/translations', verifyToken, checkPermission('reference_data.manage'), async (req, res) => {
  try {
    const translations = await themesModel.findTranslations(req.params.id);
    res.json(translations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin 
router.put('/:id/translations', verifyToken, checkPermission('reference_data.manage'), async (req, res) => {
  try {
    const updated = await themesModel.upsertTranslations(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;