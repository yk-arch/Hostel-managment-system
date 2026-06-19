const express = require('express');
const { getChatbotResponse } = require('../controllers/chatbotController');
const router = express.Router();

// Public chatbot endpoint
router.post('/', getChatbotResponse);

module.exports = router;
