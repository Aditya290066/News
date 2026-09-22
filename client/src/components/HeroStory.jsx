/**
 * HeroStory Component
 * 
 * Lead story card for the editorial homepage.
 * Features large 16:9 featured imagery with fetchpriority="high" for optimal LCP,
 * authoritative Merriweather headline, deck synopsis, and editorial metadata.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Bookmark, Globe, ChevronRight } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { getEditorialImage } from '../utils/imageUtils';
import { getArticleId, formatTimeAgo, getDisplayCategory } from '../utils/articleUtils';

export default function HeroStory({ article }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [imageFailed, setImageFailed] = useState(false);

  if (!article) return null;

  const rawCat = (article.category || 'general').toLowerCase();
  const bookmarked = isBookmarked(article.url);
  const articleId = getArticleId(article);

  const displayImage = !imageFailed && article.imageUrl
    ? article.imageUrl
    : getEditorialImage(rawCat, article.title);

  return (
    <article className="hero-story-card">
      <Link 
        to={`/article/${articleId}`}
        state={{ article }}
        className="hero-image-wrap"
      >
        <img
          src={displayImage}
          alt={article.title}
          className="hero-image"
          fetchpriority="high"
          onError={() => {
            if (!imageFailed) setImageFailed(true);
          }}
        />
      </Link>

      <div className="hero-meta-top">
        <span className="tag-badge" style={{ color: 'var(--brand-red)' }}>
          {getDisplayCategory(rawCat)}
        </span>
        <span style={{ color: 'var(--border-subtle)' }}>•</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          <Globe size={13} />
          {article.sourceName || 'Wire Service'}
        </span>
      </div>

      <h1 className="hero-headline">
        <Link 
          to={`/article/${articleId}`}
          state={{ article }}
        >
          {article.title}
        </Link>
      </h1>

      {article.description && (
        <p className="hero-deck">
          {article.description}
        </p>
      )}

      <div className="hero-footer-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={13} />
          <span>{formatTimeAgo(article.publishedAt, true)}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleBookmark(article);
            }}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.2rem 0.5rem', color: bookmarked ? 'var(--brand-red)' : 'var(--text-secondary)' }}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark story'}
          >
            <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
            <span style={{ fontSize: '0.78rem' }}>{bookmarked ? 'Saved' : 'Save'}</span>
          </button>

          <Link
            to={`/article/${articleId}`}
            state={{ article }}
            style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-red)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <span>Full Story</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
