const express = require('express');
const languagesController = require('../controllers/languagesController');

const router = express.Router();

router.get('/', languagesController.getAll);
// routes/languages.js — on ajoute une route, on garde router.get('/', ...) intact
router.get('/reference', languagesController.getAllWithId);

module.exports = router;