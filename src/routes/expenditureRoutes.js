const express = require('express');
const router = express.Router();
const c = require('../controllers/expenditureController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/', c.getAllExpenditures);
router.post('/', c.createExpenditure);
router.put('/:id', c.updateExpenditure);
router.delete('/:id', c.deleteExpenditure);

module.exports = router;