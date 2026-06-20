const Room = require('../models/roomModel');
const Fee = require('../models/feeModel');
const User = require('../models/userModel');

const sendResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({ status, message, data });
};

// Rule-based chatbot (works without AI)
const getChatbotResponse = async (req, res) => {
  console.log('📨 Chatbot request received:', req.body);
  try {
    const { query } = req.body;
    if (!query) return sendResponse(res, 400, false, 'Query is required');

    const q = query.toLowerCase();
    let response = "Hello! I'm your Hostel Assistant. Ask me about rooms, fees, the warden, or hostel rules!";

    // Fetch real public data from your Neon DB (using actual model fields)
    console.log('📊 Fetching data from DB...');
    const rooms = await Room.findAll({ attributes: ['room_number', 'floor', 'capacity', 'price_per_month'] });
    const fees = await Fee.findAll({ attributes: ['amount', 'description', 'month'] });
    const wardens = await User.findAll({ where: { role: 'admin' }, attributes: ['name', 'email'] });
    console.log('✅ Data fetched:', { roomsCount: rooms.length, feesCount: fees.length, wardensCount: wardens.length });

    // Rule: Hi/Hello
    if (q.includes('hi') || q.includes('hello')) {
      response = "Hello! Welcome to the Hostel Assistant! How can I help you today?";
    }

    // Rule: Rooms
    else if (q.includes('room')) {
      if (rooms.length > 0) {
        const availableCount = rooms.filter(r => r.capacity > 0).length;
        response = `We have ${rooms.length} total rooms, with ${availableCount} available! Here are some details: ${rooms.map(r => `Room ${r.room_number} (Floor ${r.floor}, ₹${r.price_per_month}/month, Capacity: ${r.capacity})`).join('; ')}`;
      } else {
        response = "We don't have any rooms listed yet—please check back later!";
      }
    }

    // Rule: Fees
    else if (q.includes('fee')) {
      if (fees.length > 0) {
        response = `Here are our current fees: ${fees.map(f => `${f.description || 'Monthly fee'}: ₹${f.amount} (${f.month})`).join('; ')}`;
      } else {
        response = "We don't have any fees listed yet—please contact the warden!";
      }
    }

    // Rule: Warden
    else if (q.includes('warden') || q.includes('contact')) {
      if (wardens.length > 0) {
        response = `You can contact the warden at: ${wardens.map(w => `${w.name} (${w.email})`).join(', ')}`;
      } else {
        response = "Warden information is not available yet—please check back later!";
      }
    }

    // Rule: Rules/Timings
    else if (q.includes('rule') || q.includes('time') || q.includes('gate') || q.includes('mess')) {
      response = "Hostel Rules & Timings:\n- Gate opens at 6 AM, closes at 10 PM\n- Mess: 7-9 AM (breakfast), 12-2 PM (lunch), 7-9 PM (dinner)";
    }

    // Rule: Help
    else if (q.includes('help')) {
      response = "I can help you with:\n1. Room availability and prices\n2. Fee details\n3. Warden contact info\n4. Hostel rules and timings\nJust ask your question!";
    }

    console.log('✅ Chatbot response:', response);
    return sendResponse(res, 200, true, 'Response generated', { response });
  } catch (error) {
    console.error('❌ Chatbot error:', error.message);
    console.error('❌ Full error:', error);
    return sendResponse(res, 500, false, `Server error: ${error.message}`);
  }
};

module.exports = { getChatbotResponse };
