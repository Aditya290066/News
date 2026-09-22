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
const { pool, isDbAvailable } = require('../config/db');
const { fetchNewsData } = require('./newsDataService');
const { getFallbackArticles } = require('./fallbackArticles');

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

function generateArticleId(url = '') {
  try {
    return Buffer.from(encodeURIComponent(url || ''))
      .toString('base64url')
      .replace(/=+$/, '');
  } catch {
    return Buffer.from(url || '').toString('base64url');
  }
}

/**
 * Normalizes raw article objects from NewsAPI into a consistent shape
 * @param {Object} rawArticle
 * @param {string} fallbackCategory
 * @returns {Object}
 */
function normalizeArticle(rawArticle, fallbackCategory = 'technology') {
  const articleUrl = rawArticle.url;
  return {
    id: generateArticleId(articleUrl),
    title: rawArticle.title ? rawArticle.title.trim() : 'Untitled Story',
    description: rawArticle.description ? rawArticle.description.trim() : (rawArticle.content ? rawArticle.content.slice(0, 200).trim() : 'No description available for this article.'),
    url: articleUrl,
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

const memoryCache = new Map();

/**
 * Retrieves cached response from MySQL or in-memory fallback if still fresh (< 10 minutes)
 * @param {string} queryKey
 * @returns {Promise<Object|null>}
 */
async function getCachedData(queryKey) {
  if (isDbAvailable) {
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
      // Fall through to in-memory cache
    }
  }

  // Graceful fallback to in-memory cache when MySQL is not running or in cloud serverless
  const memRecord = memoryCache.get(queryKey);
  if (memRecord) {
    const ageSeconds = Math.floor((Date.now() - memRecord.timestamp) / 1000);
    const hasArticles = Array.isArray(memRecord.data?.articles) && memRecord.data.articles.length > 0;
    return {
      isFresh: ageSeconds < CACHE_TTL_SECONDS && hasArticles,
      data: memRecord.data,
      fetchedAt: new Date(memRecord.timestamp),
      ageSeconds,
      hasArticles
    };
  }
  return null;
}

/**
 * Saves or updates response in news_cache table and memoryCache
 * @param {string} category
 * @param {string} queryKey
 * @param {Object} responseData
 */
async function setCachedData(category, queryKey, responseData) {
  // Never overwrite cache with empty results to prevent locked "No Headlines" states
  if (!responseData || !Array.isArray(responseData.articles) || responseData.articles.length === 0) {
    return;
  }

  // Always keep in-memory cache updated
  memoryCache.set(queryKey, { data: responseData, timestamp: Date.now() });

  if (isDbAvailable) {
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
      // Non-fatal: in-memory cache already stores the fresh articles
      console.warn('MySQL cache write skipped (in-memory cache active):', error.message);
    }
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
 * Fetches latest headlines, merges providers if country=in & lang=en,
 * uses NewsData.io exclusively for Hindi/Telugu, normalizes articles,
 * and writes to MySQL news_cache.
 * 
 * @param {string} category
 * @param {number} page
 * @param {number} pageSize
 * @param {string} country - Target country code (defaults to process.env.COUNTRY_CODE || 'in')
 * @param {string} lang - Language code ('en', 'hi', 'te') (defaults to 'en')
 * @returns {Promise<Object>}
 */
async function fetchAndCacheCategory(category = 'all', page = 1, pageSize = 12, country = null, lang = 'en') {
  const targetCountry = (country || process.env.COUNTRY_CODE || 'in').toLowerCase().trim();
  const targetLang = (lang || 'en').toLowerCase().trim();
  const rawCategory = (category || 'all').toLowerCase().trim();
  const apiCategory = CATEGORY_MAP[rawCategory] || (rawCategory === 'all' ? 'all' : 'general');
  const displayCategory = rawCategory === 'general' ? 'world' : rawCategory;

  const isIndia = targetCountry === 'in';
  // Cache key incorporates language so en, hi, and te results are cached separately
  const queryKey = (targetLang !== 'en')
    ? `category:${displayCategory}:country:in:lang:${targetLang}:page:${page}:ps:${pageSize}`
    : (isIndia
        ? `category:${displayCategory}:country:in:lang:en:merged:page:${page}:ps:${pageSize}`
        : `category:${displayCategory}:country:${targetCountry}:lang:en:page:${page}:ps:${pageSize}`);

  const newsApiKey = process.env.NEWS_API_KEY || '96a0bd0dde9942d9bc22480f0ff56a72';

  let mergedArticles = [];
  let totalResults = 0;
  let stats = { newsApiCount: 0, newsDataCount: 0, mergedCount: 0, language: targetLang };

  if (targetLang === 'hi' || targetLang === 'te') {
    // -------------------------------------------------------------
    // Multilingual Execution: NewsData.io ONLY (NewsAPI does not support Hindi/Telugu)
    // -------------------------------------------------------------
    const newsDataResult = await fetchNewsData(displayCategory, 'in', targetLang);
    mergedArticles = newsDataResult.articles || [];
    totalResults = newsDataResult.totalResults || mergedArticles.length;
    stats.newsDataCount = mergedArticles.length;
    stats.mergedCount = mergedArticles.length;
  } else if (isIndia) {
    // -------------------------------------------------------------
    // Parallel Execution for India (English): NewsAPI.org + NewsData.io
    // -------------------------------------------------------------
    const [newsApiResult, newsDataResult] = await Promise.allSettled([
      fetchFromNewsApi(apiCategory, displayCategory, 'in', page, pageSize, newsApiKey),
      fetchNewsData(displayCategory, 'in', 'en')
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
    // Standard Execution for other countries: NewsAPI.org with NewsData fallback
    // -------------------------------------------------------------
    const newsApiResult = await fetchFromNewsApi(apiCategory, displayCategory, targetCountry, page, pageSize, newsApiKey);
    mergedArticles = newsApiResult.articles;
    totalResults = newsApiResult.totalResults;
    stats.newsApiCount = mergedArticles.length;

    // Fallback to NewsData if NewsAPI returned empty
    if (mergedArticles.length === 0) {
      const fallbackNewsData = await fetchNewsData(displayCategory, targetCountry, 'en');
      mergedArticles = fallbackNewsData.articles;
      totalResults = fallbackNewsData.totalResults;
      stats.newsDataCount = mergedArticles.length;
    }

    stats.mergedCount = mergedArticles.length;
  }

  // If no articles were returned from providers, check existing cache first
  if (mergedArticles.length === 0) {
    const existingCache = await getCachedData(queryKey);
    if (existingCache && existingCache.data && existingCache.data.articles?.length > 0) {
      return {
        ...existingCache.data,
        cached: true,
        staleFallback: true
      };
    }

    // Guaranteed fallback: always provide curated fallback stories so frontend never shows empty state
    console.warn(`[newsService] Providing curated stories for ${displayCategory}/${targetCountry} [${targetLang}]`);
    mergedArticles = getFallbackArticles(displayCategory, pageSize);
    totalResults = mergedArticles.length;
    stats.curatedFallback = true;
    stats.mergedCount = mergedArticles.length;
  }

  const resultPayload = {
    status: 'success',
    category: displayCategory,
    country: targetCountry,
    language: targetLang,
    isMerged: targetLang === 'en' && isIndia,
    totalResults,
    page: Number(page),
    pageSize: Number(pageSize),
    articles: mergedArticles.slice(0, pageSize), // ensure requested pageSize
    stats
  };

  // Store in MySQL or in-memory cache
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
 * @param {string} lang - Language code ('en', 'hi', 'te')
 * @returns {Promise<Object>}
 */
async function getNewsByCategory(category = 'all', page = 1, pageSize = 12, country = null, forceRefresh = false, lang = 'en') {
  const targetCountry = (country || process.env.COUNTRY_CODE || 'in').toLowerCase().trim();
  const targetLang = (lang || 'en').toLowerCase().trim();
  const rawCategory = (category || 'all').toLowerCase().trim();
  const displayCategory = rawCategory === 'general' ? 'world' : rawCategory;

  const isIndia = targetCountry === 'in';
  const queryKey = (targetLang !== 'en')
    ? `category:${displayCategory}:country:in:lang:${targetLang}:page:${page}:ps:${pageSize}`
    : (isIndia
        ? `category:${displayCategory}:country:in:lang:en:merged:page:${page}:ps:${pageSize}`
        : `category:${displayCategory}:country:${targetCountry}:lang:en:page:${page}:ps:${pageSize}`);

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
    return await fetchAndCacheCategory(category, page, pageSize, targetCountry, targetLang);
  } catch (error) {
    console.error(`News fetch failed for ${category}/${targetCountry} [${targetLang}]:`, error.message);

    if (!cached) {
      cached = await getCachedData(queryKey);
    }
    if (cached && cached.data && Array.isArray(cached.data.articles) && cached.data.articles.length > 0) {
      return {
        ...cached.data,
        cached: true,
        staleFallback: true,
        cacheAgeSeconds: cached.ageSeconds
      };
    }

    // Guaranteed fallback: return curated fallback articles so users always see news
    console.warn(`[newsService] Outage fallback active for ${displayCategory}`);
    const fallbackArticles = getFallbackArticles(displayCategory, pageSize);
    return {
      status: 'success',
      category: displayCategory,
      country: targetCountry,
      language: targetLang,
      totalResults: fallbackArticles.length,
      page: Number(page),
      pageSize: Number(pageSize),
      articles: fallbackArticles,
      cached: false,
      staleFallback: true
    };
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
    console.warn(`[newsService] Search fallback active: ${apiMsg}`);

    const fallbackResults = getFallbackArticles(cleanCategory || 'all', pageSize);
    return {
      status: 'success',
      query: cleanQ,
      category: cleanCategory || 'all',
      country: targetCountry,
      totalResults: fallbackResults.length,
      page: Number(page),
      pageSize: Number(pageSize),
      articles: fallbackResults,
      cached: false,
      staleFallback: true
    };
  }
}

/**
 * Looks up an article by its unique ID across MySQL cache, memory cache, or decoded URL
 * @param {string} id
 * @returns {Promise<{ article: Object|null, related: Object[] }>}
 */
async function getArticleById(id) {
  if (!id) return { article: null, related: [] };

  let targetArticle = null;

  // 1. Search in-memory cache
  for (const cacheItem of memoryCache.values()) {
    const list = cacheItem?.data?.articles || [];
    const found = list.find(a => a.id === id || generateArticleId(a.url) === id);
    if (found) {
      targetArticle = found;
      break;
    }
  }

  // 2. Search MySQL cache if not found in memory
  if (!targetArticle) {
    try {
      const [rows] = await pool.execute(
        'SELECT response_json FROM news_cache ORDER BY fetched_at DESC LIMIT 20'
      );

      for (const row of rows) {
        try {
          const parsed = JSON.parse(row.response_json);
          const list = parsed.articles || [];
          const found = list.find(a => a.id === id || generateArticleId(a.url) === id);
          if (found) {
            targetArticle = found;
            break;
          }
        } catch {
          // ignore parsing error for single record
        }
      }
    } catch (e) {
      // Safe non-fatal fallback
    }
  }

  // 3. Fallback: decode URL from ID if reversible
  if (!targetArticle) {
    try {
      let base64 = id.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const decodedUrl = decodeURIComponent(Buffer.from(base64, 'base64').toString('utf8'));
      if (decodedUrl && decodedUrl.startsWith('http')) {
        targetArticle = {
          id,
          title: 'Wire Story Coverage',
          description: 'This news report was retrieved from the live news wire.',
          url: decodedUrl,
          sourceName: 'News Wire',
          category: 'general',
          publishedAt: new Date().toISOString()
        };
      }
    } catch {
      // safe fallback
    }
  }

  // 4. Fetch related stories from the same category
  let related = [];
  if (targetArticle) {
    const cat = targetArticle.category || 'general';
    try {
      const catNews = await getNewsByCategory(cat, 1, 5);
      related = (catNews.articles || [])
        .filter(a => a.url !== targetArticle.url)
        .slice(0, 4);
    } catch {
      related = [];
    }
  }

  return { article: targetArticle, related };
}

module.exports = {
  fetchAndCacheCategory,
  getNewsByCategory,
  searchNews,
  getCachedData,
  setCachedData,
  mergeAndDeduplicate,
  getArticleById,
  generateArticleId
};
