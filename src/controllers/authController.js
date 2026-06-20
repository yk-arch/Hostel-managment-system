const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const Student = require('../models/studentModel');
const { sendResetPasswordEmail } = require('../utils/emailService');
require('dotenv').config();

const generateToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const sendResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({ status, message, data });
};

// ─── REGISTER ────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role, admin_secret } = req.body;

    if (!name || !email || !password) {
      return sendResponse(res, 400, false,
        'Name, email and password are required');
    }

    // Debug log: Check existing user
    const existingUser = await User.findOne({ where: { email } });
    console.log('Existing user check:', existingUser ? 'User exists' : 'No user');
    if (existingUser) {
      return sendResponse(res, 409, false, 'Email is already registered');
    }

    // Debug log: Check total users
    const totalUsers = await User.count();
    console.log('Total users in DB:', totalUsers);
    let finalRole = role || 'student';
    if (totalUsers === 0) {
      finalRole = 'admin'; // First user is always admin
      console.log('Setting role to ADMIN (first user)');
    } else if (admin_secret === process.env.ADMIN_SECRET) {
      // Allow creating admin with secret key
      finalRole = 'admin';
      console.log('Setting role to ADMIN (admin secret)');
    } else {
      // Prevent non-admins from creating admin accounts
      finalRole = (role === 'admin') ? 'student' : (role || 'student');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email,
      password: hashedPassword,
      role: finalRole,
    });

    // Auto-create student entry if role is student
    if (finalRole === 'student') {
      await Student.create({
        name: name,
        email: email,
        phone: phone || 'N/A',
      });
    }

    // Create notification
    await Notification.create({
      title: 'New User Registered',
      message: `New user ${name} has registered!`,
      type: 'info',
    });

    const token = generateToken(user.id, user.email, user.role);

    return sendResponse(res, 201, true, 'Account created successfully', {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error('Register error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendResponse(res, 409, false, 'Email is already registered');
    }
    return sendResponse(res, 500, false, 'Server error. Please try again.');
  }
};

// ─── LOGIN ───────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, false, 'Email and password are required');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return sendResponse(res, 401, false, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendResponse(res, 401, false, 'Invalid email or password');
    }

    const token = generateToken(user.id, user.email, user.role);

    return sendResponse(res, 200, true, 'Login successful', {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error('Login error:', error);
    return sendResponse(res, 500, false, 'Server error. Please try again.');
  }
};

// ─── LOGOUT ──────────────────────────────────
const logout = async (req, res) => {
  return sendResponse(res, 200, true, 'Logged out successfully');
};

// ─── FORGOT PASSWORD ─────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendResponse(res, 400, false,
        'Email is required');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Return a 200 response even if email not found (security best practice)
      return sendResponse(res, 200, true,
        'If this email exists, a reset token has been sent');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await user.update({ reset_token: resetToken, reset_token_expiry: resetTokenExpiry });

    // Send email with reset token
    await sendResetPasswordEmail(email, resetToken);

    return sendResponse(res, 200, true, 'Password reset token sent to your email', {
      note: 'Check your inbox for the reset token',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ─── RESET PASSWORD ───────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { reset_token, token, new_password, password } = req.body;
    const finalToken = reset_token || token;
    const finalPassword = new_password || password;

    if (!finalToken || !finalPassword) {
      return sendResponse(res, 400, false,
        'Reset token and new password are required');
    }

    if (finalPassword.length < 6) {
      return sendResponse(res, 400, false, 'Password must be at least 6 characters');
    }

    const user = await User.findOne({ where: { reset_token: finalToken } });
    if (!user) return sendResponse(res, 400, false, 'Invalid reset token');
    if (new Date() > user.reset_token_expiry) {
      return sendResponse(res, 400, false, 'Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    await user.update({ password: hashedPassword, reset_token: null, reset_token_expiry: null });

    return sendResponse(res, 200, true, 'Password reset successfully');

  } catch (error) {
    console.error('Reset password error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ─── GET ME ───────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'reset_token', 'reset_token_expiry'] },
    });
    if (!user) return sendResponse(res, 404, false, 'User not found');
    return sendResponse(res, 200, true, 'User fetched', { user });
  } catch (error) {
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ─── UPDATE USER ROLE (ADMIN ONLY) ────────────
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'staff', 'student'].includes(role)) {
      return sendResponse(res, 400, false, 'Invalid role');
    }

    const user = await User.findByPk(id);
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    await user.update({ role });

    return sendResponse(res, 200, true, 'User role updated', { user });
  } catch (error) {
    console.error('Update user role error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ─── GET ALL USERS (ADMIN ONLY) ───────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'reset_token', 'reset_token_expiry'] },
    });
    return sendResponse(res, 200, true, 'Users fetched', { users });
  } catch (error) {
    console.error('Get all users error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

module.exports = { register, login, logout, forgotPassword, resetPassword, getMe, updateUserRole, getAllUsers };