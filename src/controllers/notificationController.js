const Notification = require('../models/notificationModel');

const sendResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({ status, message, data });
};

// ── GET ALL NOTIFICATIONS ────────────────────────
const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['created_at', 'DESC']],
    });
    return sendResponse(res, 200, true,
      'Notifications fetched', { notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── MARK NOTIFICATION AS READ ────────────────────
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return sendResponse(res, 404, false,
        'Notification not found');
    }
    await notification.update({ is_read: true });
    return sendResponse(res, 200, true,
      'Notification marked as read', { notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── DELETE NOTIFICATION ──────────────────────────
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return sendResponse(res, 404, false,
        'Notification not found');
    }
    await notification.destroy();
    return sendResponse(res, 200, true,
      'Notification deleted');
  } catch (error) {
    console.error('Delete notification error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

// ── CREATE NOTIFICATION ──────────────────────────
const createNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return sendResponse(res, 400, false,
        'Title and message are required');
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      is_read: false,
    });

    return sendResponse(res, 201, true,
      'Notification created', { notification });
  } catch (error) {
    console.error('Create notification error:', error);
    return sendResponse(res, 500, false, 'Server error.');
  }
};

module.exports = {
  getAllNotifications,
  markAsRead,
  deleteNotification,
  createNotification,
};
