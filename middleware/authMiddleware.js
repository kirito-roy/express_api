// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header (support both x-auth-token and Authorization: Bearer)
  let token = req.header('x-auth-token');
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '').replace(/"/g, ''); // Remove Bearer and any quotes
    }
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach user payload (e.g., user ID) to req.user
    next(); // Move to the next middleware/route handler
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};