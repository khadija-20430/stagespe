const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { checkRole } = require('../middleware/rbac');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.me);

router.post('/register', verifyToken, checkRole('super_admin'), authController.register);
router.get('/users', verifyToken, checkRole('super_admin'), authController.getAllUsers);
router.put('/users/:id/activate', verifyToken, checkRole('super_admin'), authController.activateUser);
router.put('/users/:id/deactivate', verifyToken, checkRole('super_admin'), authController.deactivateUser);
router.put('/users/:id/role', verifyToken, checkRole('super_admin'), authController.updateUserRole);
router.put('/users/:id/assign-role', verifyToken, checkRole('super_admin'), authController.assignCustomRole);

router.get('/my-permissions', verifyToken, authController.myPermissions);
router.get('/login-history', verifyToken, checkRole('super_admin'), authController.loginHistory);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;