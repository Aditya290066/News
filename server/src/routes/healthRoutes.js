/**
 * Health Check Routes
 * 
 * Verifies system availability and database connectivity.
 */

const express = require('express');
const { testConnection } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  const isDbHealthy = await testConnection();

  const healthData = {
    status: isDbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      server: 'online',
      database: isDbHealthy ? 'connected' : 'disconnected'
    },
    version: '1.0.0'
  };

  const statusCode = isDbHealthy ? 200 : 503;
  res.status(statusCode).json(healthData);
});

module.exports = router;
