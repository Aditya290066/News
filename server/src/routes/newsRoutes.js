/**
 * News Routes
 * 
 * Exposes endpoints for fetching category headlines and searching articles.
 * Interfaces with newsService for caching and external API calls.
 * Defaults to India ('in') as primary regional news focus.
 */

const express = require('express');
const { getNewsByCategory, searchNews } = require('../services/newsService');

const router = express.Router();

/**
 * GET /api/news
 * Fetches top headlines by category (technology, sports, business, science, health, entertainment, world, or mixed all)
 * 
 * Query parameters:
 *  - category: string (default: 'all')
 *  - country: string (default: process.env.COUNTRY_CODE || 'in')
 *  - page: number (default: 1)
 *  - pageSize: number (default: 12)
 *  - refresh: boolean (default: false)
 */
router.get('/', async (req, res, next) => {
  try {
    const category = req.query.category || 'all';
    const country = req.query.country || process.env.COUNTRY_CODE || 'in';
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 12;
    const forceRefresh = req.query.refresh === 'true';

    const data = await getNewsByCategory(category, page, pageSize, country, forceRefresh);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/news/search
 * Searches articles matching a keyword query, optional category, and country
 * 
 * Query parameters:
 *  - q: search keyword
 *  - category: optional category filter
 *  - country: string (default: process.env.COUNTRY_CODE || 'in')
 *  - page: number (default: 1)
 *  - pageSize: number (default: 12)
 */
router.get('/search', async (req, res, next) => {
  try {
    const query = req.query.q || '';
    const category = req.query.category || '';
    const country = req.query.country || process.env.COUNTRY_CODE || 'in';
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 12;

    if (!query && !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a search term (q) or select a category.'
      });
    }

    const data = await searchNews(query, category, page, pageSize, country);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
