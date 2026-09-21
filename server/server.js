/**
 * Real News - Express Application Server
 * 
 * Entry point for the backend REST API.
 * Performs pre-flight checks on environment and credentials before boot.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// -------------------------------------------------------------
// Pre-flight Verification: Check if .env and NEWS_API_KEY exist
// -------------------------------------------------------------
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.error(`
\x1b[31m\x1b[1m╔═════════════════════════════════════════════════════════════════════════════╗
║                      ⚠️   SETUP CONFIGURATION REQUIRED                      ║
╠═════════════════════════════════════════════════════════════════════════════╣
║  The configuration file (server/.env) was not found!                        ║
║                                                                             ║
║  Please run the one-time interactive setup wizard to configure your app:    ║
║                                                                             ║
║    👉  \x1b[33m\x1b[1mnpm run setup\x1b[31m\x1b[1m                                                            ║
║        (or 'node setup.js' inside the /server directory)                    ║
║                                                                             ║
║  This wizard will prompt for your NewsAPI key & MySQL credentials,          ║
║  write your .env file, and automatically initialize all database tables.    ║
╚═════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`);
  process.exit(1);
}

// Load environment variables
dotenv.config({ path: envPath });

const newsApiKey = process.env.NEWS_API_KEY;
if (!newsApiKey || newsApiKey === 'your_newsapi_key_here' || newsApiKey.trim() === '') {
  console.error(`
\x1b[31m\x1b[1m╔═════════════════════════════════════════════════════════════════════════════╗
║                      ⚠️   MISSING NEWSAPI.ORG KEY                           ║
╠═════════════════════════════════════════════════════════════════════════════╣
║  A valid NEWS_API_KEY was not found in server/.env!                         ║
║                                                                             ║
║  1. Obtain a free API key at: \x1b[34mhttps://newsapi.org/register\x1b[31m\x1b[1m                  ║
║  2. Run the interactive setup script:                                       ║
║                                                                             ║
║    👉  \x1b[33m\x1b[1mnpm run setup\x1b[31m\x1b[1m                                                            ║
╚═════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`);
  process.exit(1);
}

// -------------------------------------------------------------
// Initialize Express App and Dependencies
// -------------------------------------------------------------
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { testConnection } = require('./src/config/db');
const { initScheduler } = require('./src/jobs/scheduler');
const authRoutes = require('./src/routes/authRoutes');
const newsRoutes = require('./src/routes/newsRoutes');
const bookmarkRoutes = require('./src/routes/bookmarkRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// -------------------------------------------------------------
// Middleware Configuration
// -------------------------------------------------------------
app.use(cors({
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
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
    name: 'Real News API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      news: '/api/news?category=technology|sports',
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
  console.log(`\n\x1b[32m\x1b[1m✔ Real News Backend running on http://localhost:${PORT}\x1b[0m`);
  console.log(`  Target Client URL: ${CLIENT_URL}`);
  
  // Verify database connectivity
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log(`\x1b[32m✔ MySQL Database connection established successfully.\x1b[0m\n`);
  } else {
    console.warn(`\x1b[33m⚠️  Warning: MySQL connection could not be established. Ensure MySQL is running.\x1b[0m\n`);
  }

  // Initialize automated background news refresh cron scheduler
  initScheduler();
});

module.exports = { app, server };
