const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const auditLogsController = require('../controllers/auditLogsController');

const router = express.Router();

router.get('/', verifyToken, checkRole('super_admin'), auditLogsController.getAll);
router.get('/document-access/:documentId', verifyToken, checkRole('super_admin'), auditLogsController.getDocumentAccess);

module.exports = router;