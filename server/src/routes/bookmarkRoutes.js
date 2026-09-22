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

// In-memory fallback bookmarks store when database is not connected (e.g. serverless Vercel)
const memoryBookmarks = new Map(); // key: userId, value: Array of bookmark objects

// Apply auth middleware to all bookmark routes
router.use(requireAuth);

/**
 * GET /api/bookmarks
 * Returns all saved articles for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    try {
      const [rows] = await pool.execute(
        `SELECT id, user_id, title, description, url, image_url AS imageUrl, 
                source_name AS sourceName, category, published_at AS publishedAt, 
                saved_at AS savedAt
         FROM saved_articles
         WHERE user_id = ?
         ORDER BY saved_at DESC`,
        [userId]
      );

      return res.json({
        status: 'success',
        count: rows.length,
        bookmarks: rows
      });
    } catch (dbErr) {
      console.warn('MySQL unavailable on GET /bookmarks, using memory fallback:', dbErr.message);
      const userList = memoryBookmarks.get(userId) || [];
      return res.json({
        status: 'success',
        count: userList.length,
        bookmarks: userList
      });
    }
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

    try {
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
        (await pool.execute('SELECT id FROM saved_articles WHERE user_id = ? AND url = ? LIMIT 1', [userId, url]))[0][0]?.id
      );

      return res.status(201).json({
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
    } catch (dbErr) {
      console.warn('MySQL unavailable on POST /bookmarks, using memory fallback:', dbErr.message);

      const userList = memoryBookmarks.get(userId) || [];
      const existingIndex = userList.findIndex(b => b.url === url);
      const newBookmark = {
        id: `mem_bm_${Date.now()}`,
        userId,
        title,
        description: description || '',
        url,
        imageUrl: imageUrl || null,
        sourceName: sourceName || 'Unknown',
        category: category || 'general',
        publishedAt: publishedAt || new Date().toISOString(),
        savedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        userList[existingIndex] = newBookmark;
      } else {
        userList.unshift(newBookmark);
      }
      memoryBookmarks.set(userId, userList);

      return res.status(201).json({
        status: 'success',
        message: 'Article saved to bookmarks.',
        bookmark: newBookmark
      });
    }
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
    const bookmarkId = req.params.id;

    try {
      const numId = parseInt(bookmarkId, 10);
      if (!isNaN(numId)) {
        const [result] = await pool.execute(
          'DELETE FROM saved_articles WHERE id = ? AND user_id = ?',
          [numId, userId]
        );

        if (result.affectedRows > 0) {
          return res.json({
            status: 'success',
            message: 'Bookmark removed successfully.',
            removedId: bookmarkId
          });
        }
      }
    } catch (dbErr) {
      console.warn('MySQL unavailable on DELETE /bookmarks, using memory fallback:', dbErr.message);
    }

    // In-memory fallback
    const userList = memoryBookmarks.get(userId) || [];
    const initialLen = userList.length;
    const filtered = userList.filter(b => String(b.id) !== String(bookmarkId));

    if (filtered.length < initialLen) {
      memoryBookmarks.set(userId, filtered);
      return res.json({
        status: 'success',
        message: 'Bookmark removed successfully.',
        removedId: bookmarkId
      });
    }

    res.status(404).json({
      status: 'error',
      message: 'Bookmark not found or you do not have permission to delete it.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
