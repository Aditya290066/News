/**
 * ArticleDetailPage Component
 * 
 * Reader preview view for individual stories with full headline, meta,
 * synopsis, bookmark toggle, and an external link that opens the original
 * source publication in a new tab.
 */

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Bookmark, 
  Share2, 
  Clock, 
  Globe, 
  Newspaper, 
  Check 
} from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { useToast } from '../context/ToastContext';
import { formatTimeAgo } from '../components/NewsCard';
import { getEditorialImage } from '../utils/imageUtils';

export default function ArticleDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  // Retrieve article payload passed from Link state
  const article = location.state?.article;

  // Fallback if accessed directly without state
  if (!article) {
    return (
      <div className="container" style={{ paddingBlock: '4rem', textAlign: 'center' }}>
        <div className="empty-state">
          <Newspaper size={48} color="var(--text-muted)" />
          <h2 className="empty-title">Article Not Found</h2>
          <p className="empty-desc">
            No story data was provided. Please choose an article from the news stream.
          </p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            <ArrowLeft size={16} />
            <span>Return to Headlines</span>
          </Link>
        </div>
      </div>
    );
  }

  const bookmarked = isBookmarked(article.url);
  const category = (article.category || 'general').toLowerCase();
  const isTech = category.includes('tech');
  const isSports = category.includes('sport');

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(article.url);
      setCopied(true);
      addToast('Article URL copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      addToast('Could not copy link to clipboard.', 'error');
    }
  };

  return (
    <div className="container">
      <article className="article-detail-wrap">
        {/* Navigation Back Link */}
        <button 
          onClick={() => navigate(-1)} 
          className="detail-back-link"
        >
          <ArrowLeft size={16} />
          <span>Back to articles</span>
        </button>

        {/* Header Information */}
        <header className="detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span className={`tag-badge ${isTech ? 'tag-tech' : isSports ? 'tag-sports' : 'tag-general'}`}>
              {category}
            </span>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Globe size={14} />
              {article.sourceName || 'News Source'}
            </span>
          </div>

          <h1 className="detail-title">
            {article.title}
          </h1>

          <div className="detail-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={15} />
              Published {formatTimeAgo(article.publishedAt)}
            </span>
            {article.publishedAt && (
              <span>
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>
        </header>

        {/* Hero Image */}
        <div className="detail-image-box">
          <img 
            src={article.imageUrl || getEditorialImage(category, article.title)} 
            alt={article.title} 
            className="detail-image"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getEditorialImage(category, article.title);
            }}
          />
        </div>

        {/* Article Synopsis */}
        <div className="detail-content">
          <p style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            {article.description}
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            This summary is aggregated from <strong>{article.sourceName}</strong>. Real News indexes breaking updates and routes full readership directly to publisher websites to support investigative journalism.
          </p>
        </div>

        {/* Bottom Action Bar with External Link (opens in new tab) */}
        <footer className="detail-action-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => toggleBookmark(article)}
              className={`btn btn-secondary ${bookmarked ? 'active' : ''}`}
              style={{ color: bookmarked ? 'var(--accent-gold)' : 'inherit' }}
            >
              <Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'} />
              <span>{bookmarked ? 'Saved in Bookmarks' : 'Save Article'}</span>
            </button>

            <button
              onClick={handleShare}
              className="btn btn-secondary"
              title="Copy share link"
            >
              {copied ? <Check size={17} color="#10b981" /> : <Share2 size={17} />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>

          {/* Primary CTA: External link that opens original article in a new tab */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <span>Read Full Story on {article.sourceName || 'Source'}</span>
            <ExternalLink size={16} />
          </a>
        </footer>
      </article>
    </div>
  );
}
