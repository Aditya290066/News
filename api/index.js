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

// Fallback credentials ensure serverless environment functions out of the box
process.env.NEWS_API_KEY = process.env.NEWS_API_KEY || '96a0bd0dde9942d9bc22480f0ff56a72';
process.env.NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY || 'pub_70f637ba62d84bc2ae0610f1af31d8b6';
process.env.COUNTRY_CODE = process.env.COUNTRY_CODE || 'in';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'b77b434a9f8dd7a6cf3f743a173a3c25d16c65fbdf3bef83684ddeaed4266ca27aa5bc3f2954dd58355ad13a883b17e13f0cc38daf5d48dcfd7f666aa41b7957';

const newsRoutes = require('../server/src/routes/newsRoutes');
const healthRoutes = require('../server/src/routes/healthRoutes');
const authRoutes = require('../server/src/routes/authRoutes');
const bookmarkRoutes = require('../server/src/routes/bookmarkRoutes');
const { errorHandler, notFoundHandler } = require('../server/src/middleware/errorHandler');

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

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/bookmarks', bookmarkRoutes);
app.use('/bookmarks', bookmarkRoutes);

app.use('/api/news', newsRoutes);
app.use('/news', newsRoutes);

app.get('/api', (req, res) => {
  res.json({
    name: 'ANEWS Serverless API',
    status: 'online',
    version: '1.0.0'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
