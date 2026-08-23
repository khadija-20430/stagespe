const express = require('express');
const languagesController = require('../controllers/languagesController');

const router = express.Router();

router.get('/', languagesController.getAll);

module.exports = router;