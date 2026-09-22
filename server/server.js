/**
 * Real News - Express Application Server
 * 
 * Entry point for the backend REST API.
 * Performs pre-flight checks on environment and credentials before boot.
 * Incorporates Winston structured logging and Express rate limiting.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// -------------------------------------------------------------
// Pre-flight Verification: Check if .env and NEWS_API_KEY exist
// -------------------------------------------------------------
const envPath = path.join(__dirname, '.env');

// Load environment variables from .env if present, or fallback to process.env (for cloud deployment)
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const logger = require('./src/utils/logger');

const newsApiKey = process.env.NEWS_API_KEY;
if (!newsApiKey || newsApiKey === 'your_newsapi_key_here' || newsApiKey.trim() === '') {
  logger.error('A valid NEWS_API_KEY was not found in server/.env or environment variables!');
  process.exit(1);
}

// -------------------------------------------------------------
// Initialize Express App and Dependencies
// -------------------------------------------------------------
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./src/config/db');
const { initScheduler } = require('./src/jobs/scheduler');
const authRoutes = require('./src/routes/authRoutes');
const newsRoutes = require('./src/routes/newsRoutes');
const bookmarkRoutes = require('./src/routes/bookmarkRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5001;

// -------------------------------------------------------------
// CORS Configuration (Production & Development Readiness)
// -------------------------------------------------------------
const clientUrlEnv = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [
  ...clientUrlEnv.split(',').map(url => url.trim().replace(/\/$/, '')),
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or if origin in allowed list
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked request from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// -------------------------------------------------------------
// Rate Limiting Protection Middleware
// -------------------------------------------------------------
// General API Rate Limiter: 150 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Strict Auth Rate Limiter: 30 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// -------------------------------------------------------------
// Request Logging & Body Parsing
// -------------------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    } else {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

// Root greeting route
app.get('/', (req, res) => {
  res.json({
    name: 'ANEWS Editorial REST API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      news: '/api/news?category=technology|sports|business|world',
      article: '/api/news/article/:id',
      search: '/api/news/search?q=&category=',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      bookmarks: '/api/bookmarks',
      health: '/api/health'
    }
  });
});

// Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

// -------------------------------------------------------------
// Server Boot & Database Verification
// -------------------------------------------------------------
const server = app.listen(PORT, async () => {
  logger.info(`ANEWS Backend running on port ${PORT}`);
  logger.info(`Allowed Client Origins: ${allowedOrigins.join(', ')}`);

  // Verify database connectivity
  const dbConnected = await testConnection();
  if (dbConnected) {
    logger.info('MySQL Database connection established successfully.');
  } else {
    logger.warn('MySQL connection could not be established. Ensure MySQL is running.');
  }

  // Initialize automated background news refresh cron scheduler
  initScheduler();
});

module.exports = { app, server };
