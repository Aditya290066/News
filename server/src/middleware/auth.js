/**
 * Authentication Middleware
 * 
 * Verifies JWT bearer tokens in incoming HTTP requests.
 * Attaches decoded user payload (id, email, name) to `req.user`.
 */

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No authentication token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Malformed authorization header.'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me';
    const decoded = jwt.verify(token, secret);
    
    // Attach user information to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token has expired. Please log in again.'
      });
    }

    return res.status(401).json({
      status: 'error',
      message: 'Invalid authentication token.'
    });
  }
}

module.exports = {
  requireAuth
};
