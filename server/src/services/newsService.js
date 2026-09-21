/**
 * News Service & Multi-Provider Aggregator
 * 
 * Supports NewsAPI.org and NewsData.io with:
 * - India ('in') as primary default news focus
 * - Parallel fetching via Promise.allSettled for country=in
 * - Intelligent deduplication (by canonical URL and normalized title)
 * - Sorting by publishedAt (newest first)
 * - MySQL caching in news_cache table with 'merged' tagging
 * - Resilient fallback to stale cache on network/rate-limit interruptions
 */

const axios = require('axios');
const { pool } = require('../config/db');
const { fetchNewsData } = require('./newsDataService');

const CACHE_TTL_SECONDS = 600; // 10 minutes cache TTL
const NEWS_API_BASE = 'https://newsapi.org/v2';

// Supported NewsAPI categories mapping
const CATEGORY_MAP = {
  technology: 'technology',
  tech: 'technology',
  sports: 'sports',
  sport: 'sports',
  business: 'business',
  science: 'science',
  health: 'health',
  entertainment: 'entertainment',
  world: 'general',
  general: 'general',
  all: 'all'
};

/**
 * Normalizes raw article objects from NewsAPI into a consistent shape
 * @param {Object} rawArticle
 * @param {string} fallbackCategory
 * @returns {Object}
 */
function normalizeArticle(rawArticle, fallbackCategory = 'technology') {
  return {
    title: rawArticle.title ? rawArticle.title.trim() : 'Untitled Story',
    description: rawArticle.description ? rawArticle.description.trim() : (rawArticle.content ? rawArticle.content.slice(0, 200).trim() : 'No description available for this article.'),
    url: rawArticle.url,
    imageUrl: rawArticle.urlToImage || null,
    sourceName: rawArticle.source?.name || 'News Wire',
    category: rawArticle.category || fallbackCategory,
    publishedAt: rawArticle.publishedAt || new Date().toISOString(),
    provider: 'NewsAPI.org'
  };
}

/**
 * Normalizes a URL for comparison by stripping protocol, www, and query params
 * @param {string} url
 * @returns {string}
 */
function cleanUrl(url = '') {
  try {
    const parsed = new URL(url);
    return (parsed.hostname.replace(/^www\./, '') + parsed.pathname).toLowerCase().replace(/\/$/, '');
  } catch {
    return (url || '').toLowerCase().trim();
  }
}

/**
 * Normalizes an article title for fuzzy collision detection
 * @param {string} title
 * @returns {string}
 */
function cleanTitle(title = '') {
  return (title || '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Merges two article lists, eliminates duplicate stories by URL or title,
 * and sorts the combined array newest-first.
 * 
 * @param {Object[]} listA - Articles from NewsAPI
 * @param {Object[]} listB - Articles from NewsData.io
 * @returns {Object[]} Deduplicated, chronologically sorted articles
 */
function mergeAndDeduplicate(listA = [], listB = []) {
  const seenUrls = new Set();
  const seenTitles = new Set();
  const merged = [];

  const combined = [...listA, ...listB];

  for (const article of combined) {
    if (!article || !article.title) continue;

    const urlKey = cleanUrl(article.url);
    const titleKey = cleanTitle(article.title);

    // Skip duplicates
    if (urlKey && seenUrls.has(urlKey)) continue;
    if (titleKey && titleKey.length > 15 && seenTitles.has(titleKey)) continue;

    if (urlKey) seenUrls.add(urlKey);
    if (titleKey && titleKey.length > 15) seenTitles.add(titleKey);

    merged.push(article);
  }

  // Sort newest first
  merged.sort((a, b) => {
    const timeA = new Date(a.publishedAt).getTime() || 0;
    const timeB = new Date(b.publishedAt).getTime() || 0;
    return timeB - timeA;
  });

  return merged;
}

/**
 * Retrieves cached response from MySQL if still fresh (< 10 minutes)
 * @param {string} queryKey
 * @returns {Promise<Object|null>}
 */
async function getCachedData(queryKey) {
  try {
    const [rows] = await pool.execute(
      `SELECT response_json, fetched_at, 
              TIMESTAMPDIFF(SECOND, fetched_at, NOW()) AS age_seconds 
       FROM news_cache 
       WHERE query_key = ?`,
      [queryKey]
    );

    if (rows.length > 0) {
      const record = rows[0];
      const parsedData = JSON.parse(record.response_json);
      const hasArticles = Array.isArray(parsedData.articles) && parsedData.articles.length > 0;
      const isFresh = record.age_seconds !== null && record.age_seconds < CACHE_TTL_SECONDS && hasArticles;

      return {
        isFresh,
        data: parsedData,
        fetchedAt: record.fetched_at,
        ageSeconds: record.age_seconds,
        hasArticles
      };
    }
  } catch (error) {
    console.error('Error reading news cache:', error.message);
  }
  return null;
}

/**
 * Saves or updates response in news_cache table
 * @param {string} category
 * @param {string} queryKey
 * @param {Object} responseData
 */
async function setCachedData(category, queryKey, responseData) {
  // Never overwrite cache with empty results to prevent locked "No Headlines" states
  if (!responseData || !Array.isArray(responseData.articles) || responseData.articles.length === 0) {
    return;
  }

  try {
    const jsonString = JSON.stringify(responseData);
    await pool.execute(
      `INSERT INTO news_cache (category, query_key, response_json, fetched_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         category = VALUES(category),
         response_json = VALUES(response_json),
         fetched_at = NOW()`,
      [category || 'general', queryKey, jsonString]
    );
  } catch (error) {
    console.error('Error saving to news cache:', error.message);
    throw error;
  }
}

/**
 * Fetches news from NewsAPI.org directly
 * @param {string} apiCategory
 * @param {string} displayCategory
 * @param {string} country
 * @param {number} page
 * @param {number} pageSize
 * @param {string} apiKey
 * @returns {Promise<{ articles: Object[], totalResults: number }>}
 */
async function fetchFromNewsApi(apiCategory, displayCategory, country, page, pageSize, apiKey) {
  if (!apiKey) return { articles: [], totalResults: 0 };

  try {
    if (apiCategory === 'all') {
      const halfSize = Math.max(2, Math.ceil(pageSize / 2));
      const [techRes, sportsRes] = await Promise.allSettled([
        axios.get(`${NEWS_API_BASE}/top-headlines`, {
          params: { country, category: 'technology', page, pageSize: halfSize, apiKey },
          timeout: 8000
        }),
        axios.get(`${NEWS_API_BASE}/top-headlines`, {
          params: { country, category: 'sports', page, pageSize: halfSize, apiKey },
          timeout: 8000
        })
      ]);

      const techArticles = techRes.status === 'fulfilled' && techRes.value.data.articles
        ? techRes.value.data.articles.map(a => normalizeArticle(a, 'technology'))
        : [];

      const sportsArticles = sportsRes.status === 'fulfilled' && sportsRes.value.data.articles
        ? sportsRes.value.data.articles.map(a => normalizeArticle(a, 'sports'))
        : [];

      let combined = [];
      const maxLength = Math.max(techArticles.length, sportsArticles.length);
      for (let i = 0; i < maxLength; i++) {
        if (techArticles[i]) combined.push(techArticles[i]);
        if (sportsArticles[i]) combined.push(sportsArticles[i]);
      }

      // If NewsAPI top-headlines returned 0 for India, query /everything to get fresh Indian coverage
      if (country === 'in' && combined.length === 0) {
        try {
          const fallbackRes = await axios.get(`${NEWS_API_BASE}/everything`, {
            params: {
              q: 'India AND (technology OR sports OR business)',
              sortBy: 'publishedAt',
              language: 'en',
              page,
              pageSize,
              apiKey
            },
            timeout: 8000
          });
          const fbArticles = (fallbackRes.data?.articles || [])
            .filter(a => a.title && a.title !== '[Removed]')
            .map(a => normalizeArticle(a, 'general'));
          return {
            articles: fbArticles,
            totalResults: fallbackRes.data?.totalResults || fbArticles.length
          };
        } catch (fbErr) {
          console.warn(`[NewsAPI] India mixed fallback failed:`, fbErr.message);
        }
      }

      return {
        articles: combined,
        totalResults: (techRes.value?.data?.totalResults || 0) + (sportsRes.value?.data?.totalResults || 0)
      };
    } else {
      const response = await axios.get(`${NEWS_API_BASE}/top-headlines`, {
        params: { country, category: apiCategory, page, pageSize, apiKey },
        timeout: 8000
      });

      let articles = (response.data.articles || [])
        .filter(a => a.title && a.title !== '[Removed]')
        .map(a => normalizeArticle(a, displayCategory));

      // If NewsAPI top-headlines returned 0 for India, query /everything for Indian coverage in this category
      if (country === 'in' && articles.length === 0) {
        try {
          const fallbackRes = await axios.get(`${NEWS_API_BASE}/everything`, {
            params: {
              q: `India ${displayCategory === 'world' ? 'international' : displayCategory}`,
              sortBy: 'publishedAt',
              language: 'en',
              page,
              pageSize,
              apiKey
            },
            timeout: 8000
          });
          articles = (fallbackRes.data?.articles || [])
            .filter(a => a.title && a.title !== '[Removed]')
            .map(a => normalizeArticle(a, displayCategory));
        } catch (fbErr) {
          console.warn(`[NewsAPI] India category fallback failed for ${displayCategory}:`, fbErr.message);
        }
      }

      return {
        articles,
        totalResults: response.data.totalResults || articles.length
      };
    }
  } catch (err) {
    console.warn(`[NewsAPI] Top headlines fetch failed for ${apiCategory}/${country}:`, err.response?.data?.message || err.message);
    return { articles: [], totalResults: 0 };
  }
}

/**
 * Fetches latest headlines, merges providers if country=in, normalizes articles,
 * and writes to MySQL news_cache.
 * 
 * @param {string} category
 * @param {number} page
 * @param {number} pageSize
 * @param {string} country - Target country code (defaults to process.env.COUNTRY_CODE || 'in')
 * @returns {Promise<Object>}
 */
async function fetchAndCacheCategory(category = 'all', page = 1, pageSize = 12, country = null) {
  const targetCountry = (country || process.env.COUNTRY_CODE || 'in').toLowerCase().trim();
  const rawCategory = (category || 'all').toLowerCase().trim();
  const apiCategory = CATEGORY_MAP[rawCategory] || (rawCategory === 'all' ? 'all' : 'general');
  const displayCategory = rawCategory === 'general' ? 'world' : rawCategory;

  const isIndia = targetCountry === 'in';
  // Cache key reflects merged status for India
  const queryKey = isIndia
    ? `category:${displayCategory}:country:in:merged:page:${page}:ps:${pageSize}`
    : `category:${displayCategory}:country:${targetCountry}:page:${page}:ps:${pageSize}`;

  const newsApiKey = process.env.NEWS_API_KEY;

  let mergedArticles = [];
  let totalResults = 0;
  let stats = { newsApiCount: 0, newsDataCount: 0, mergedCount: 0 };

  if (isIndia) {
    // -------------------------------------------------------------
    // Parallel Execution for India: NewsAPI.org + NewsData.io
    // -------------------------------------------------------------
    const [newsApiResult, newsDataResult] = await Promise.allSettled([
      fetchFromNewsApi(apiCategory, displayCategory, 'in', page, pageSize, newsApiKey),
      fetchNewsData(displayCategory, 'in')
    ]);

    const newsApiArticles = newsApiResult.status === 'fulfilled' ? newsApiResult.value.articles : [];
    const newsDataArticles = newsDataResult.status === 'fulfilled' ? newsDataResult.value.articles : [];

    stats.newsApiCount = newsApiArticles.length;
    stats.newsDataCount = newsDataArticles.length;

    // Merge & deduplicate
    mergedArticles = mergeAndDeduplicate(newsApiArticles, newsDataArticles);
    stats.mergedCount = mergedArticles.length;
    totalResults = (newsApiResult.value?.totalResults || 0) + (newsDataResult.value?.totalResults || 0);

    if (totalResults === 0) {
      totalResults = mergedArticles.length;
    }
  } else {
    // -------------------------------------------------------------
    // Standard Execution for other countries: NewsAPI.org only
    // -------------------------------------------------------------
    const newsApiResult = await fetchFromNewsApi(apiCategory, displayCategory, targetCountry, page, pageSize, newsApiKey);
    mergedArticles = newsApiResult.articles;
    totalResults = newsApiResult.totalResults;
    stats.newsApiCount = mergedArticles.length;
    stats.mergedCount = mergedArticles.length;
  }

  // If no articles were returned, fallback to any existing non-empty cache
  if (mergedArticles.length === 0) {
    const existingCache = await getCachedData(queryKey);
    if (existingCache && existingCache.data && existingCache.data.articles?.length > 0) {
      return {
        ...existingCache.data,
        cached: true,
        staleFallback: true
      };
    }
  }

  const resultPayload = {
    status: 'success',
    category: displayCategory,
    country: targetCountry,
    isMerged: isIndia,
    totalResults,
    page: Number(page),
    pageSize: Number(pageSize),
    articles: mergedArticles.slice(0, pageSize), // ensure requested pageSize
    stats
  };

  // Store in MySQL cache
  await setCachedData(displayCategory, queryKey, resultPayload);

  return {
    ...resultPayload,
    cached: false
  };
}

/**
 * Main category news getter with 10-minute cache inspection
 * 
 * @param {string} category
 * @param {number} page
 * @param {number} pageSize
 * @param {string} country
 * @param {boolean} forceRefresh
 * @returns {Promise<Object>}
 */
async function getNewsByCategory(category = 'all', page = 1, pageSize = 12, country = null, forceRefresh = false) {
  const targetCountry = (country || process.env.COUNTRY_CODE || 'in').toLowerCase().trim();
  const rawCategory = (category || 'all').toLowerCase().trim();
  const displayCategory = rawCategory === 'general' ? 'world' : rawCategory;

  const isIndia = targetCountry === 'in';
  const queryKey = isIndia
    ? `category:${displayCategory}:country:in:merged:page:${page}:ps:${pageSize}`
    : `category:${displayCategory}:country:${targetCountry}:page:${page}:ps:${pageSize}`;

  // 1. Check MySQL Cache unless forcing refresh
  let cached = null;
  if (!forceRefresh) {
    cached = await getCachedData(queryKey);
    if (cached && cached.isFresh) {
      return {
        ...cached.data,
        cached: true,
        cacheAgeSeconds: cached.ageSeconds
      };
    }
  }

  try {
    return await fetchAndCacheCategory(category, page, pageSize, targetCountry);
  } catch (error) {
    console.error(`News fetch failed for ${category}/${targetCountry}:`, error.message);

    if (!cached) {
      cached = await getCachedData(queryKey);
    }
    if (cached && cached.data) {
      return {
        ...cached.data,
        cached: true,
        staleFallback: true,
        cacheAgeSeconds: cached.ageSeconds
      };
    }
    throw new Error(`Failed to retrieve news: ${error.message}`);
  }
}

/**
 * Searches news by keyword and optional category with caching
 * 
 * @param {string} q
 * @param {string} category
 * @param {number} page
 * @param {number} pageSize
 * @param {string} country
 * @returns {Promise<Object>}
 */
async function searchNews(q = '', category = '', page = 1, pageSize = 12, country = null) {
  const cleanQ = (q || '').trim();
  const cleanCategory = (category || '').trim().toLowerCase();
  const targetCountry = (country || process.env.COUNTRY_CODE || 'in').toLowerCase().trim();
  const queryKey = `search:${encodeURIComponent(cleanQ)}:cat:${cleanCategory}:country:${targetCountry}:page:${page}:ps:${pageSize}`;

  // 1. Check MySQL Cache
  const cached = await getCachedData(queryKey);
  if (cached && cached.isFresh) {
    return {
      ...cached.data,
      cached: true,
      cacheAgeSeconds: cached.ageSeconds
    };
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('NEWS_API_KEY is not configured. Please run `npm run setup`.');
  }

  try {
    let endpoint = `${NEWS_API_BASE}/everything`;
    let params = {
      q: cleanQ || (cleanCategory ? cleanCategory : 'india news'),
      language: 'en',
      sortBy: 'publishedAt',
      page,
      pageSize,
      apiKey
    };

    if (cleanCategory && cleanCategory !== 'all') {
      endpoint = `${NEWS_API_BASE}/top-headlines`;
      params = {
        q: cleanQ || undefined,
        category: cleanCategory,
        country: targetCountry,
        page,
        pageSize,
        apiKey
      };
    }

    const response = await axios.get(endpoint, { params, timeout: 8000 });

    const articles = (response.data.articles || [])
      .filter(a => a.title && a.title !== '[Removed]')
      .map(a => normalizeArticle(a, cleanCategory || 'general'));

    const resultPayload = {
      status: 'success',
      query: cleanQ,
      category: cleanCategory || 'all',
      country: targetCountry,
      totalResults: response.data.totalResults || articles.length,
      page: Number(page),
      pageSize: Number(pageSize),
      articles
    };

    await setCachedData(cleanCategory || 'search', queryKey, resultPayload);

    return {
      ...resultPayload,
      cached: false
    };
  } catch (error) {
    console.error('News search failed:', error.response?.data || error.message);

    if (cached && cached.data) {
      return {
        ...cached.data,
        cached: true,
        staleFallback: true,
        cacheAgeSeconds: cached.ageSeconds
      };
    }

    const apiMsg = error.response?.data?.message || error.message;
    throw new Error(`Failed to search news: ${apiMsg}`);
  }
}

module.exports = {
  fetchAndCacheCategory,
  getNewsByCategory,
  searchNews,
  getCachedData,
  setCachedData,
  mergeAndDeduplicate
};
