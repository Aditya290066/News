/**
 * Scheduled News Refresher Job
 * 
 * Loops through all supported categories, calls the shared newsService aggregator
 * with country="in" (India default), and updates the MySQL news_cache table.
 * 
 * Supported categories:
 * - technology
 * - sports
 * - business
 * - science
 * - health
 * - entertainment
 * - general (world)
 */

const { fetchAndCacheCategory } = require('../services/newsService');

// All supported categories to refresh
const CATEGORIES_TO_REFRESH = [
  'technology',
  'sports',
  'business',
  'science',
  'health',
  'entertainment',
  'general'
];

/**
 * Helper to pause execution between consecutive external API calls
 * @param {number} ms
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes the scheduled news refresh job across all categories for India (country="in")
 * @param {string} country - Target country code (defaults to 'in')
 * @returns {Promise<{ successful: string[], failed: string[] }>}
 */
async function refreshAllNews(country = 'in') {
  const targetCountry = (country || process.env.COUNTRY_CODE || 'in').toLowerCase().trim();
  console.log(`\n[cron] Starting scheduled news cache refresh across ${CATEGORIES_TO_REFRESH.length} categories for [${targetCountry.toUpperCase()}]...`);
  const startTime = Date.now();

  const results = {
    successful: [],
    failed: []
  };

  for (const category of CATEGORIES_TO_REFRESH) {
    try {
      // Calls shared fetchAndCacheCategory function which queries NewsAPI & NewsData.io in parallel for 'in'
      const res = await fetchAndCacheCategory(category, 1, 12, targetCountry);
      const stats = res?.stats || {
        newsApiCount: 0,
        newsDataCount: 0,
        mergedCount: res?.articles?.length || 0
      };

      console.log(`[cron] ${category} refreshed: ${stats.newsApiCount} from NewsAPI + ${stats.newsDataCount} from NewsData.io = ${stats.mergedCount} total after dedupe`);
      results.successful.push(category);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      console.error(`[cron] ${category} refresh FAILED: ${errorMsg}`);
      results.failed.push({ category, error: errorMsg });
    }

    // Brief 800ms delay between calls to safeguard external rate limits
    await delay(800);
  }

  // Also refresh the mixed 'all' feed for the home page in English
  try {
    const homeRes = await fetchAndCacheCategory('all', 1, 12, targetCountry, 'en');
    const homeStats = homeRes?.stats || {
      newsApiCount: 0,
      newsDataCount: 0,
      mergedCount: homeRes?.articles?.length || 0
    };
    console.log(`[cron] home (all) [EN] refreshed: ${homeStats.newsApiCount} from NewsAPI + ${homeStats.newsDataCount} from NewsData.io = ${homeStats.mergedCount} total after dedupe`);
    results.successful.push('all_en');
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`[cron] home (all) [EN] refresh FAILED: ${errorMsg}`);
    results.failed.push({ category: 'all_en', error: errorMsg });
  }

  // -------------------------------------------------------------
  // Multilingual Cache Warmup: Hindi (hi) & Telugu (te)
  // Refreshes high-priority categories while strictly safeguarding NewsData free-tier quota (~200 reqs/day)
  // Primary categories: all (Home), general (Top Stories), technology, sports
  // -------------------------------------------------------------
  const MULTILINGUAL_CATEGORIES = ['all', 'general', 'technology', 'sports'];
  const secondaryLanguages = ['hi', 'te'];

  for (const lang of secondaryLanguages) {
    for (const category of MULTILINGUAL_CATEGORIES) {
      try {
        const langRes = await fetchAndCacheCategory(category, 1, 12, targetCountry, lang);
        const count = langRes?.articles?.length || 0;
        console.log(`[cron] [${lang.toUpperCase()}] ${category} refreshed: ${count} articles cached`);
        results.successful.push(`${category}_${lang}`);
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.warn(`[cron] [${lang.toUpperCase()}] ${category} refresh notice: ${errorMsg}`);
        results.failed.push({ category: `${category}_${lang}`, error: errorMsg });
      }

      await delay(800);
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[cron] News refresh complete in ${durationSec}s. Succeeded: ${results.successful.length}, Failed: ${results.failed.length}\n`);

  return results;
}

module.exports = {
  refreshAllNews,
  CATEGORIES_TO_REFRESH
};
