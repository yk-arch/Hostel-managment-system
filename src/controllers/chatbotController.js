const { GoogleGenerativeAI } = require('@google/generative-ai');
const Room = require('../models/roomModel');
const Fee = require('../models/feeModel');
const User = require('../models/userModel');

// Initialize Gemini with your API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const sendResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({ status, message, data });
};

// Handle chatbot queries with Gemini + real Neon DB data
const getChatbotResponse = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return sendResponse(res, 400, false, 'Query is required');

    // Fetch real public data from your Neon DB (using actual model fields)
    const rooms = await Room.findAll({ attributes: ['room_number', 'floor', 'capacity', 'price_per_month'] });
    const fees = await Fee.findAll({ attributes: ['amount', 'description', 'month'] });
    const wardens = await User.findAll({ where: { role: 'admin' }, attributes: ['name', 'email'] });

    // Create a context prompt for Gemini (with real DB data)
    const context = `
You are a friendly hostel assistant. Use ONLY this data to answer questions:
- ROOMS: ${rooms.map(r => `Room ${r.room_number} (Floor ${r.floor}, Capacity ${r.capacity}, ₹${r.price_per_month}/month)`).join(', ')}
- FEES: ${fees.map(f => `${f.description || 'Monthly fee'}: ₹${f.amount} (For: ${f.month})`).join(', ')}
- WARDEN: ${wardens.length > 0 ? `Name: ${wardens[0].name}, Email: ${wardens[0].email}` : 'Not available'}
- HOSTEL RULES: Gate closes at 10 PM, mess timings: 7-9 AM (breakfast), 12-2 PM (lunch), 7-9 PM (dinner)
If you don't know the answer, say "I don't have info about that—please contact the warden!"
`;

    // Ask Gemini to generate a response
    const result = await model.generateContent(`${context}\n\nUser Query: ${query}`);
    const response = result.response.text().trim();

    return sendResponse(res, 200, true, 'Response generated', { response });
  } catch (error) {
    console.error('Chatbot error:', error);
    return sendResponse(res, 500, false, 'Server error—please try again later');
  }
};

module.exports = { getChatbotResponse };
