/**
 * NewsData.io Service
 * 
 * Secondary news provider specifically tailored for Indian news coverage (country=in).
 * Formats API responses into the universal Real News article schema:
 * { title, description, url, imageUrl, sourceName, category, publishedAt }
 */

const axios = require('axios');

const NEWSDATA_BASE_URL = 'https://newsdata.io/api/1/news';

// Map internal category names to NewsData.io supported categories
// NewsData.io categories: business, entertainment, environment, food, health, politics, science, sports, technology, top, tourism, world
const NEWSDATA_CATEGORY_MAP = {
  technology: 'technology',
  tech: 'technology',
  sports: 'sports',
  sport: 'sports',
  business: 'business',
  science: 'science',
  health: 'health',
  entertainment: 'entertainment',
  world: 'world',
  general: 'top',
  top: 'top',
  all: 'top,technology,sports'
};

/**
 * Normalizes an article object from NewsData.io into the standard shape
 * @param {Object} raw
 * @param {string} fallbackCategory
 * @returns {Object}
 */
function normalizeNewsDataArticle(raw, fallbackCategory = 'general') {
  let pubDate = raw.pubDate;
  if (pubDate) {
    const d = new Date(pubDate);
    if (!isNaN(d.getTime())) {
      pubDate = d.toISOString();
    }
  }

  return {
    title: raw.title ? raw.title.trim() : 'Untitled Story',
    description: raw.description ? raw.description.trim() : (raw.content ? raw.content.slice(0, 200).trim() : 'No description available for this story.'),
    url: raw.link || raw.url,
    imageUrl: raw.image_url || null,
    sourceName: raw.source_name || raw.source_id || 'India Wire',
    category: fallbackCategory,
    publishedAt: pubDate || new Date().toISOString(),
    provider: 'NewsData.io'
  };
}

/**
 * Fetches news from NewsData.io API
 * 
 * @param {string} category - Target category
 * @param {string} country - Country code (defaults to 'in')
 * @returns {Promise<{ articles: Object[], totalResults: number, provider: string, count: number }>}
 */
async function fetchNewsData(category = 'all', country = 'in') {
  const apiKey = process.env.NEWSDATA_API_KEY || 'pub_70f637ba62d84bc2ae0610f1af31d8b6';

  if (!apiKey || apiKey === 'your_newsdata_key_here' || apiKey.trim() === '') {
    // Graceful fallback if user hasn't configured NewsData key yet
    return {
      articles: [],
      totalResults: 0,
      provider: 'NewsData.io',
      count: 0,
      skipped: true
    };
  }

  const rawCat = (category || 'all').toLowerCase().trim();
  const apiCategory = NEWSDATA_CATEGORY_MAP[rawCat] || 'top';
  const displayCategory = rawCat === 'general' ? 'world' : rawCat;

  try {
    const params = {
      apikey: apiKey.trim(),
      country: country.toLowerCase().trim(),
      language: 'en'
    };

    if (apiCategory) {
      params.category = apiCategory;
    }

    const response = await axios.get(NEWSDATA_BASE_URL, {
      params,
      timeout: 8000 // 8s timeout to avoid blocking
    });

    const results = response.data?.results || [];
    const validArticles = results
      .filter((item) => item && (item.link || item.url) && item.title && item.title !== '[Removed]')
      .map((item) => normalizeNewsDataArticle(item, displayCategory));

    return {
      articles: validArticles,
      totalResults: response.data?.totalResults || validArticles.length,
      provider: 'NewsData.io',
      count: validArticles.length
    };
  } catch (error) {
    const errorMsg = error.response?.data?.results?.message || error.response?.data?.message || error.message;
    console.warn(`[NewsData.io] Fetch failed for ${category}/${country}:`, errorMsg);
    
    // Return empty list instead of throwing so Promise.allSettled gracefully degrades
    return {
      articles: [],
      totalResults: 0,
      provider: 'NewsData.io',
      count: 0,
      error: errorMsg
    };
  }
}

module.exports = {
  fetchNewsData,
  normalizeNewsDataArticle,
  NEWSDATA_CATEGORY_MAP
};
