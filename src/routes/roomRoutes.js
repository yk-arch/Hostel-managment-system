const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes protected
router.use(authMiddleware);

router.get('/', roomController.getAllRooms);
router.get('/available', roomController.getAvailableRooms);
router.get('/:id', roomController.getRoomById);
router.post('/', roomController.createRoom);
router.put('/:id', roomController.updateRoom);
router.delete('/:id', roomController.deleteRoom);
router.post('/allocate', roomController.allocateRoom);
router.post('/deallocate', roomController.deallocateRoom);
router.post('/change', roomController.changeRoom);
router.post('/interchange', roomController.interchangeRoom);

module.exports = router;