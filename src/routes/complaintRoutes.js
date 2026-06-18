const express = require('express');
const router = express.Router();
const c = require('../controllers/complaintController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/', c.getAllComplaints);
router.get('/:id', c.getComplaintById);
router.post('/', c.createComplaint);
router.put('/:id/status', c.updateStatus);
router.delete('/:id', c.deleteComplaint);

module.exports = router;