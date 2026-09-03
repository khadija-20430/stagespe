const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkRole, checkPermission } = require('../middleware/rbac');
const authController = require('../controllers/authController');

const router = express.Router();

// ==================== LOGIN / LOGOUT ====================
router.post('/login', authController.login);
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.me);

// ==================== USER MANAGEMENT (par permission) ====================
router.post('/register', verifyToken, checkPermission('users.create'), authController.register);
router.get('/users', verifyToken, checkPermission('users.view'), authController.getAllUsers);
router.put('/users/:id/activate', verifyToken, checkPermission('users.edit'), authController.activateUser);
router.put('/users/:id/deactivate', verifyToken, checkPermission('users.edit'), authController.deactivateUser);
router.put('/users/:id/role', verifyToken, checkPermission('users.edit'), authController.updateUserRole);
router.put('/users/:id/assign-role', verifyToken, checkPermission('users.edit'), authController.assignCustomRole);
router.put('/users/:id/profile', verifyToken, checkPermission('users.edit'), authController.updateUserProfile);
router.delete('/users/:id', verifyToken, checkPermission('users.delete'), authController.deleteUser);

// ==================== PERMISSIONS & HISTORY ====================
router.get('/my-permissions', verifyToken, authController.myPermissions);
router.get('/login-history', verifyToken, checkRole('super_admin'), authController.loginHistory);

// ==================== PASSWORD RESET (Public - pas de verifyToken) ====================
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

module.exports = router;