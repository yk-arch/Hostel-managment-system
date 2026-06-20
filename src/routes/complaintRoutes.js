const express = require('express');
const router = express.Router();
const c = require('../controllers/complaintController');
const auth = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.use(auth);
router.get('/', c.getAllComplaints);
router.get('/:id', c.getComplaintById);
router.post('/', c.createComplaint);
// Only admins and staff can update complaint status
router.put('/:id/status', authorizeRoles('admin', 'staff'), c.updateStatus);
// Only admins can delete complaints
router.delete('/:id', authorizeRoles('admin'), c.deleteComplaint);

module.exports = router;