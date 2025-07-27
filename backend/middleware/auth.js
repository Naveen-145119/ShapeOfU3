const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    console.log('Protect Middleware: Received Token:', token); // THIS LOG IS CRUCIAL

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Protect Middleware: Decoded Token:', decoded); // THIS LOG IS CRUCIAL

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ success: false, message: 'Token is not valid. User not found.' });
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: 'Account is deactivated.' });
      }

      req.user = user;
      console.log('Protect Middleware: req.user set successfully.'); // THIS LOG IS CRUCIAL
      next();
    } catch (error) {
      console.error('Protect Middleware: Token verification failed:', error.message); // THIS LOG IS CRUCIAL
      return res.status(401).json({ success: false, message: 'Token is not valid.' });
    }
  } catch (error) {
    console.error('Auth middleware (outer) error:', error);
    res.status(500).json({ success: false, message: 'Server error in authentication' });
  }
};

// Admin only access
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but continue without user
        console.log('Optional auth: Invalid token');
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = {
  protect,
  admin,
  optionalAuth
};