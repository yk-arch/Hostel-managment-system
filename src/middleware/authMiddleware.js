const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: false,
        message: 'Access denied. No token provided.',
        data: null,
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: false,
        message: 'Session expired. Please login again.',
        data: null,
      });
    }
    return res.status(401).json({
      status: false,
      message: 'Invalid token.',
      data: null,
    });
  }
};

module.exports = authMiddleware;