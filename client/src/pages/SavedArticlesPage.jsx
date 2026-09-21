/**
 * SavedArticlesPage Component
 * 
 * Protected view displaying the user's personal bookmark collection.
 * Allows quick removal, category filtering, and direct reading.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Trash2, ExternalLink, Clock, Newspaper, ArrowLeft, Filter } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { formatTimeAgo } from '../components/NewsCard';
import { getEditorialImage } from '../utils/imageUtils';

export default function SavedArticlesPage() {
  const { bookmarks, removeBookmark, loading } = useBookmarks();
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredBookmarks = bookmarks.filter((b) => {
    if (categoryFilter === 'all') return true;
    return (b.category || '').toLowerCase().includes(categoryFilter);
  });

  return (
    <div className="container" style={{ paddingBlock: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800 }}>
              Saved Articles
            </h1>
            <span className="nav-badge" style={{ fontSize: '0.85rem', padding: '0.2rem 0.6rem' }}>
              {bookmarks.length}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Your personal library of bookmarked technology and sports stories.
          </p>
        </div>

        {/* Filter Pills */}
        {bookmarks.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              className={`btn btn-sm ${categoryFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryFilter('all')}
            >
              All ({bookmarks.length})
            </button>
            <button
              className={`btn btn-sm ${categoryFilter === 'technology' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryFilter('technology')}
            >
              Tech
            </button>
            <button
              className={`btn btn-sm ${categoryFilter === 'sports' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryFilter('sports')}
            >
              Sports
            </button>
          </div>
        )}
      </div>

      {/* Bookmarks List */}
      {filteredBookmarks.length > 0 ? (
        <div className="news-grid">
          {filteredBookmarks.map((article) => {
            const category = (article.category || 'general').toLowerCase();
            const isTech = category.includes('tech');
            const isSports = category.includes('sport');

            return (
              <article key={article.id} className="news-card">
                {/* Image Container */}
                <div className="card-image-wrap">
                  <img 
                    src={article.imageUrl || getEditorialImage(category, article.title)} 
                    alt={article.title} 
                    className="card-image"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getEditorialImage(category, article.title);
                    }}
                  />

                  {/* Delete Bookmark Button */}
                  <button
                    className="card-bookmark-btn"
                    onClick={() => removeBookmark(article.id)}
                    title="Remove from saved articles"
                    style={{ color: '#ef4444' }}
                    aria-label="Remove bookmark"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                {/* Content Body */}
                <div className="card-body">
                  <div className="card-meta-row">
                    <span className={`tag-badge ${isTech ? 'tag-tech' : isSports ? 'tag-sports' : 'tag-general'}`}>
                      {category}
                    </span>
                    <div className="card-time">
                      <Clock size={13} />
                      <span>{formatTimeAgo(article.publishedAt || article.savedAt)}</span>
                    </div>
                  </div>

                  <h3 className="card-title">
                    <Link to="/article" state={{ article }}>
                      {article.title}
                    </Link>
                  </h3>

                  <p className="card-description">
                    {article.description}
                  </p>

                  <div className="card-footer">
                    <span className="card-source">
                      {article.sourceName || 'Saved Article'}
                    </span>

                    <div className="card-actions">
                      <Link 
                        to="/article" 
                        state={{ article }}
                        style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}
                      >
                        Preview
                      </Link>
                      <span style={{ color: 'var(--border-subtle)' }}>•</span>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-external-link"
                      >
                        <span>Source</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Bookmark size={32} />
          </div>
          <h3 className="empty-title">
            {bookmarks.length === 0 ? 'No Saved Articles Yet' : 'No Articles Matching Filter'}
          </h3>
          <p className="empty-desc">
            {bookmarks.length === 0 
              ? 'When browsing articles, click the bookmark icon on any card to save stories for later reading.'
              : 'Try selecting a different category filter or clear the selection.'}
          </p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            <ArrowLeft size={16} />
            <span>Explore Headlines</span>
          </Link>
        </div>
      )}
    </div>
  );
}
