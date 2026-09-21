/**
 * Centralized Error Handling Middleware
 * 
 * Intercepts uncaught errors across routes and provides consistent JSON error responses.
 */

function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  // Handle specific MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      status: 'error',
      message: 'A record with this information already exists.'
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      status: 'error',
      message: 'Database connection refused. Please ensure MySQL is running.'
    });
  }

  // Handle JWT errors passed through
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid authorization token.'
    });
  }

  // Default to 500 or existing status code
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal server error. Please try again later.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 Route Not Found Handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found.`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
