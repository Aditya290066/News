/**
 * Background Job Scheduler
 * 
 * Schedules periodic news data fetching using node-cron.
 * 
 * RATE LIMIT SAFEGUARD EXPLANATION:
 * -------------------------------------------------------------
 * NewsAPI.org's free developer tier allows up to 100 requests per 24 hours.
 * 
 * If we refreshed all 7 categories (+ 1 home mixed feed) every 10 minutes:
 *   8 requests * 6 runs/hour * 24 hours = 1,152 requests/day!
 * This would exhaust the free-tier quota within 2 hours.
 * 
 * Therefore, for the free tier, the default interval is set to 60 minutes ('0 * * * *'):
 *   8 requests * 1 run/hour = 8 requests/hour.
 * 
 * This can be customized via REFRESH_INTERVAL_MINUTES in server/.env
 * (e.g., set to 10 if you have a paid commercial NewsAPI tier).
 */

const cron = require('node-cron');
const { refreshAllNews } = require('./refreshNews');

/**
 * Derives a standard 5-part cron expression from interval in minutes
 * @param {number} intervalMinutes
 * @returns {string}
 */
function getCronExpression(intervalMinutes) {
  const mins = parseInt(intervalMinutes, 10);
  if (isNaN(mins) || mins >= 60 || mins <= 0) {
    // Top of every hour
    return '0 * * * *';
  }
  return `*/${mins} * * * *`;
}

/**
 * Initializes the background cron schedule and executes an initial refresh
 */
function initScheduler() {
  const intervalMinutes = parseInt(process.env.REFRESH_INTERVAL_MINUTES || '60', 10);
  const cronExpression = getCronExpression(intervalMinutes);

  console.log(`[scheduler] Initializing news refresher with schedule: '${cronExpression}' (every ${intervalMinutes} mins)`);

  const task = cron.schedule(cronExpression, async () => {
    try {
      console.log(`[scheduler] Triggering scheduled refresh at ${new Date().toISOString()}`);
      await refreshAllNews();
    } catch (err) {
      // Safe error boundary - catches any unexpected errors to ensure server never crashes
      console.error('[scheduler] Unexpected error during scheduled news refresh:', err.message);
    }
  });

  // Run initial refresh once on startup (deferred by 2 seconds so server finishes booting first)
  setTimeout(async () => {
    try {
      console.log('[scheduler] Executing startup news cache warm-up...');
      await refreshAllNews();
    } catch (err) {
      console.warn('[scheduler] Startup warm-up notice:', err.message);
    }
  }, 2000);

  return task;
}

module.exports = {
  initScheduler,
  getCronExpression
};
