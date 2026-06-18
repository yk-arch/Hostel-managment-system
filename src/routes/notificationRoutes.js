const express = require('express');
const router = express.Router();
const c = require('../controllers/notificationController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/', c.getAllNotifications);
router.put('/:id/read', c.markAsRead);
router.delete('/:id', c.deleteNotification);
router.post('/', c.createNotification);

module.exports = router;
