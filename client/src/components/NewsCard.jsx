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
import { getArticleId, formatTimeAgo, getDisplayCategory } from '../utils/articleUtils';

export { formatTimeAgo };

export default function NewsCard({ article }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [imageFailed, setImageFailed] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const bookmarked = isBookmarked(article.url);
  const rawCat = (article.category || 'technology').toLowerCase();
  const articleId = getArticleId(article);

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

  const getCategoryClass = () => {
    if (rawCat.includes('tech')) return 'tag-badge tag-tech';
    if (rawCat.includes('sport')) return 'tag-badge tag-sports';
    if (rawCat.includes('busin')) return 'tag-badge tag-business';
    if (rawCat.includes('sci')) return 'tag-badge tag-science';
    if (rawCat.includes('health')) return 'tag-badge tag-health';
    if (rawCat.includes('entertain')) return 'tag-badge tag-entertainment';
    return 'tag-badge tag-world';
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
            size={16} 
            fill={bookmarked ? 'currentColor' : 'none'} 
          />
        </button>
      </div>

      {/* Card Body */}
      <div className="card-body">
        {/* Meta Row: Editorial Category Label & Time */}
        <div className="card-meta-row">
          <span className={getCategoryClass()}>
            {getDisplayCategory(rawCat)}
          </span>
          <div className="card-time">
            <Clock size={12} />
            <span>{formatTimeAgo(article.publishedAt)}</span>
          </div>
        </div>

        {/* Headline: 2-line clamped serif headline */}
        <h3 className="card-title" title={article.title}>
          <Link 
            to={`/article/${articleId}`}
            state={{ article }}
          >
            {article.title}
          </Link>
        </h3>

        {/* Short Summary Description */}
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
              to={`/article/${articleId}`} 
              state={{ article }}
              style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}
            >
              Read
            </Link>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="card-external-link"
              title="Open full article on publisher site"
            >
              <span>Source</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
