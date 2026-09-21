/**
 * Bookmarks / Saved Articles Routes
 * 
 * Allows authenticated users to save, view, and delete articles.
 * All routes are protected by the requireAuth middleware.
 */

const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all bookmark routes
router.use(requireAuth);

/**
 * GET /api/bookmarks
 * Returns all saved articles for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT id, user_id, title, description, url, image_url AS imageUrl, 
              source_name AS sourceName, category, published_at AS publishedAt, 
              saved_at AS savedAt
       FROM saved_articles
       WHERE user_id = ?
       ORDER BY saved_at DESC`,
      [userId]
    );

    res.json({
      status: 'success',
      count: rows.length,
      bookmarks: rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookmarks
 * Saves an article for the authenticated user
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      url,
      imageUrl,
      sourceName,
      category,
      publishedAt
    } = req.body;

    if (!title || !url) {
      return res.status(400).json({
        status: 'error',
        message: 'Article title and URL are required to bookmark.'
      });
    }

    // Format published_at for MySQL DATETIME
    let formattedPublishedAt = null;
    if (publishedAt) {
      const dateObj = new Date(publishedAt);
      if (!isNaN(dateObj.getTime())) {
        formattedPublishedAt = dateObj.toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    // Insert or update on duplicate (user_id, url)
    const [result] = await pool.execute(
      `INSERT INTO saved_articles 
        (user_id, title, description, url, image_url, source_name, category, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         description = VALUES(description),
         image_url = VALUES(image_url),
         source_name = VALUES(source_name),
         category = VALUES(category),
         saved_at = CURRENT_TIMESTAMP`,
      [
        userId,
        title,
        description || '',
        url,
        imageUrl || null,
        sourceName || 'Unknown',
        category || 'general',
        formattedPublishedAt
      ]
    );

    const bookmarkId = result.insertId || (
      // If updated rather than inserted, query existing id
      (await pool.execute('SELECT id FROM saved_articles WHERE user_id = ? AND url = ? LIMIT 1', [userId, url]))[0][0]?.id
    );

    res.status(201).json({
      status: 'success',
      message: 'Article saved to bookmarks.',
      bookmark: {
        id: bookmarkId,
        userId,
        title,
        description,
        url,
        imageUrl,
        sourceName,
        category,
        publishedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/bookmarks/:id
 * Removes a saved article by ID for the authenticated user
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookmarkId = parseInt(req.params.id, 10);

    if (isNaN(bookmarkId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid bookmark ID.'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM saved_articles WHERE id = ? AND user_id = ?',
      [bookmarkId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Bookmark not found or you do not have permission to delete it.'
      });
    }

    res.json({
      status: 'success',
      message: 'Bookmark removed successfully.',
      removedId: bookmarkId
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
