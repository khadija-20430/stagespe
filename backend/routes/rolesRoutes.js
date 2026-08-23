const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const rolesController = require('../controllers/rolesController');

const router = express.Router();

router.get('/', verifyToken, checkRole('super_admin'), rolesController.getAll);
router.get('/:id', verifyToken, checkRole('super_admin'), rolesController.getOne);
router.post('/', verifyToken, checkRole('super_admin'), rolesController.create);
router.put('/:id', verifyToken, checkRole('super_admin'), rolesController.update);
router.put('/:id/permissions', verifyToken, checkRole('super_admin'), rolesController.replacePermissions);
router.put('/:id/permissions/toggle', verifyToken, checkRole('super_admin'), rolesController.togglePermission);
router.delete('/:id', verifyToken, checkRole('super_admin'), rolesController.remove);

module.exports = router;