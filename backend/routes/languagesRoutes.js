const express = require('express');
const languagesController = require('../controllers/languagesController');

const router = express.Router();

router.get('/', languagesController.getAll);
router.get('/reference', languagesController.getAllWithId);

module.exports = router;