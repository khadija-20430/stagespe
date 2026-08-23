const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkPermission } = require('../middleware/rbac');
const projectPartnersController = require('../controllers/projectPartnersController');

const router = express.Router();

router.get('/project/:projectId', projectPartnersController.getAllByProject);
router.post('/', verifyToken, checkPermission('projects.edit'), projectPartnersController.create);
router.delete('/:id', verifyToken, checkPermission('projects.edit'), projectPartnersController.remove);

module.exports = router;