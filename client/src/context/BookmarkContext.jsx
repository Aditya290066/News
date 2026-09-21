/**
 * Bookmark Context
 * 
 * Manages saved articles state, synchronization with MySQL backend,
 * and optimistic toggle actions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const BookmarkContext = createContext(null);

export function BookmarkProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch bookmarks from backend whenever user is authenticated
  const fetchBookmarks = useCallback(async () => {
    if (!isAuthenticated) {
      setBookmarks([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.get('/bookmarks');
      if (response.data.status === 'success') {
        setBookmarks(response.data.bookmarks || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  /**
   * Checks if an article URL is in the user's bookmarks
   * @param {string} url
   * @returns {boolean}
   */
  const isBookmarked = useCallback((url) => {
    return bookmarks.some((b) => b.url === url);
  }, [bookmarks]);

  /**
   * Toggles bookmark state for an article
   * @param {Object} article
   * @returns {Promise<boolean>} returns true if saved, false if removed, null if not authenticated
   */
  const toggleBookmark = async (article) => {
    if (!isAuthenticated) {
      addToast('Please sign in to save articles to your bookmarks.', 'info');
      return null;
    }

    const existing = bookmarks.find((b) => b.url === article.url);

    if (existing) {
      // Remove bookmark
      try {
        await axiosClient.delete(`/bookmarks/${existing.id}`);
        setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
        addToast('Article removed from bookmarks.', 'info');
        return false;
      } catch (error) {
        addToast('Failed to remove bookmark. Please try again.', 'error');
        return true;
      }
    } else {
      // Save bookmark
      try {
        const payload = {
          title: article.title,
          description: article.description,
          url: article.url,
          imageUrl: article.imageUrl,
          sourceName: article.sourceName,
          category: article.category || 'general',
          publishedAt: article.publishedAt
        };

        const response = await axiosClient.post('/bookmarks', payload);
        if (response.data.status === 'success') {
          setBookmarks((prev) => [response.data.bookmark, ...prev]);
          addToast('Saved to your bookmarks!', 'success');
          return true;
        }
      } catch (error) {
        addToast('Failed to save article. Please try again.', 'error');
        return false;
      }
    }
  };

  /**
   * Explicitly removes a bookmark by id
   * @param {number} bookmarkId
   */
  const removeBookmark = async (bookmarkId) => {
    try {
      await axiosClient.delete(`/bookmarks/${bookmarkId}`);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      addToast('Article removed from bookmarks.', 'info');
    } catch (error) {
      addToast('Failed to remove bookmark.', 'error');
    }
  };

  const value = {
    bookmarks,
    bookmarkCount: bookmarks.length,
    loading,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    refreshBookmarks: fetchBookmarks
  };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}
