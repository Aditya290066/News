/**
 * Winston Structured Logger
 * 
 * Provides production-grade structured logging with levels (info, warn, error),
 * ISO timestamps, and clean colorized output.
 */

const { createLogger, format, transports } = require('winston');

const logFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat()
  ),
  defaultMeta: { service: 'real-news-backend' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        logFormat
      )
    })
  ]
});

module.exports = logger;
