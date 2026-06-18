const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', feeController.getAllFees);
router.get('/pending', feeController.getPendingFees);
router.get('/student/:studentId', feeController.getFeesByStudent);
router.post('/', feeController.createFee);
router.put('/:id/pay', feeController.markAsPaid);
router.delete('/:id', feeController.deleteFee);

module.exports = router;