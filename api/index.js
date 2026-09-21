const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env if available locally, or fallback to Vercel environment variables
const envPath = path.join(__dirname, '../server/.env');
if (require('fs').existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const newsRoutes = require('../server/src/routes/newsRoutes');
const healthRoutes = require('../server/src/routes/healthRoutes');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Support both /api/path and /path in case Vercel rewrites strip or preserve the prefix
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

app.use('/api/news', newsRoutes);
app.use('/news', newsRoutes);

app.get('/api', (req, res) => {
  res.json({
    name: 'ANEWS Serverless API',
    status: 'online',
    version: '1.0.0'
  });
});

module.exports = app;
