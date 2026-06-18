const express = require('express');
const router = express.Router();
const laundryController = require('../controllers/laundryController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', laundryController.getAllLaundry);
router.get('/student/:studentId', laundryController.getLaundryByStudent);
router.post('/', laundryController.createLaundry);
router.put('/:id/status', laundryController.updateStatus);
router.delete('/:id', laundryController.deleteLaundry);

module.exports = router;
