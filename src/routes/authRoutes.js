const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.getMe);
router.get('/users', authMiddleware, authorizeRoles('admin'), authController.getAllUsers);
router.put('/users/:id/role', authMiddleware, authorizeRoles('admin'), authController.updateUserRole);

module.exports = router;