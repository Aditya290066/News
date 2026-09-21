/**
 * NewsCard Component
 * 
 * Displays individual news stories with:
 * - 16:9 aspect-ratio hero imagery with curated editorial fallbacks
 * - Distinct colored category badges across all 7 categories
 * - Clamped 2-line headline with ellipsis
 * - Clamped 3-line muted description summary
 * - Relative time-ago, publisher attribution, and bookmark toggle
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock, ExternalLink } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { getEditorialImage } from '../utils/imageUtils';

/**
 * Formats timestamps into human-readable relative time
 * @param {string} dateString
 * @returns {string}
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return 'Recent';
  const published = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - published) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return published.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NewsCard({ article }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [imageFailed, setImageFailed] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const bookmarked = isBookmarked(article.url);
  const rawCat = (article.category || 'technology').toLowerCase();

  // Pick display image (remote image or high-res curated fallback)
  const displayImage = !imageFailed && article.imageUrl 
    ? article.imageUrl 
    : getEditorialImage(rawCat, article.title);

  const handleBookmarkClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling) return;

    setIsToggling(true);
    await toggleBookmark(article);
    setIsToggling(false);
  };

  // Assign distinct colored tag per category
  const getCategoryClass = () => {
    if (rawCat.includes('tech')) return 'tag-badge tag-tech';
    if (rawCat.includes('sport')) return 'tag-badge tag-sports';
    if (rawCat.includes('busin')) return 'tag-badge tag-business';
    if (rawCat.includes('sci')) return 'tag-badge tag-science';
    if (rawCat.includes('health')) return 'tag-badge tag-health';
    if (rawCat.includes('entertain')) return 'tag-badge tag-entertainment';
    if (rawCat.includes('world') || rawCat.includes('gen')) return 'tag-badge tag-world';
    return 'tag-badge tag-tech';
  };

  const getDisplayCategoryName = () => {
    if (rawCat === 'general') return 'World';
    return rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
  };

  return (
    <article className="news-card">
      {/* 16:9 Image Container */}
      <div className="card-image-wrap">
        <img 
          src={displayImage} 
          alt={article.title} 
          className="card-image"
          loading="lazy"
          onError={() => {
            if (!imageFailed) {
              setImageFailed(true);
            }
          }}
        />

        {/* Floating Bookmark Toggle */}
        <button 
          className={`card-bookmark-btn ${bookmarked ? 'active' : ''}`}
          onClick={handleBookmarkClick}
          disabled={isToggling}
          title={bookmarked ? 'Remove from bookmarks' : 'Save article'}
          aria-label={bookmarked ? 'Remove from bookmarks' : 'Save article'}
        >
          <Bookmark 
            size={17} 
            fill={bookmarked ? 'currentColor' : 'none'} 
          />
        </button>
      </div>

      {/* Card Body */}
      <div className="card-body">
        {/* Meta Row: Colored Category Tag & Time */}
        <div className="card-meta-row">
          <span className={getCategoryClass()}>
            {getDisplayCategoryName()}
          </span>
          <div className="card-time">
            <Clock size={13} />
            <span>{formatTimeAgo(article.publishedAt)}</span>
          </div>
        </div>

        {/* Headline: 2-line clamped */}
        <h3 className="card-title" title={article.title}>
          <Link 
            to="/article"
            state={{ article }}
          >
            {article.title}
          </Link>
        </h3>

        {/* Short Summary Description: 3-line clamped */}
        <p className="card-description">
          {article.description || 'Read full investigative coverage, background context, and publisher developments on original wire.'}
        </p>

        {/* Footer: Publisher & Source Link */}
        <div className="card-footer">
          <span className="card-source">
            {article.sourceName || 'News Wire'}
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
              title="Open full article on source site"
            >
              <span>Source</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
