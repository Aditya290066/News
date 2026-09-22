/**
 * ArticleDetailPage Component - BBC / Reuters Editorial Grade
 * 
 * Reader preview view for individual stories featuring:
 * - Route: /article/:id
 * - Authoritative Merriweather typography, large editorial imagery with caption
 * - Metadata row: Category tag, source name + wire icon, relative timestamp + full date
 * - Full snippet / synopsis with generous reading line-height
 * - Clearly styled "Continue reading at [Source Name]" CTA button opening original article
 * - "Related Stories" rail displaying 3-4 articles from the same category
 * - Share action bar: Copy Link, Share to X (Twitter), Share to WhatsApp, and Bookmark toggle
 * - Dynamic Open Graph and Twitter Card SEO meta tags via react-helmet-async
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, 
  ExternalLink, 
  Bookmark, 
  Share2, 
  Clock, 
  Globe, 
  Check, 
  Compass,
  MessageCircle,
  Twitter
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useBookmarks } from '../context/BookmarkContext';
import { useToast } from '../context/ToastContext';
import NewsCard from '../components/NewsCard';
import { ArticleDetailSkeleton } from '../components/LoadingSkeleton';
import { getEditorialImage } from '../utils/imageUtils';
import { getArticleId, decodeArticleId, formatTimeAgo, getDisplayCategory } from '../utils/articleUtils';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addToast } = useToast();

  const [article, setArticle] = useState(location.state?.article || null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(!location.state?.article);
  const [copied, setCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // If article not in location state, attempt recovery via ID decoding or backend search
  useEffect(() => {
    async function loadArticle() {
      if (article) return;
      if (!id) return;

      try {
        setLoading(true);
        // Try decoding canonical URL from ID
        const decodedUrl = decodeArticleId(id);

        // Fetch category or recent news to locate the story
        const res = await axiosClient.get('/news', {
          params: { category: 'all', pageSize: 30 }
        });

        if (res.data?.status === 'success' && res.data.articles?.length > 0) {
          const found = res.data.articles.find(a => 
            getArticleId(a) === id || (decodedUrl && a.url === decodedUrl)
          );

          if (found) {
            setArticle(found);
          } else if (decodedUrl) {
            // Reconstruct minimal article structure from decoded URL
            setArticle({
              title: 'Wire Story Coverage',
              description: 'This news dispatch was shared from our real-time coverage stream.',
              url: decodedUrl,
              sourceName: 'International Wire',
              category: 'general',
              publishedAt: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.error('Failed to load article detail:', err);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [id, article]);

  // Fetch 3-4 Related Stories from the same category
  useEffect(() => {
    async function fetchRelated() {
      if (!article) return;
      const cat = (article.category || 'general').toLowerCase();

      try {
        const res = await axiosClient.get('/news', {
          params: {
            category: cat,
            pageSize: 5
          }
        });

        if (res.data?.status === 'success' && res.data.articles) {
          // Filter out the current article
          const related = res.data.articles
            .filter(a => a.url !== article.url)
            .slice(0, 4);
          setRelatedArticles(related);
        }
      } catch (err) {
        // Silently fail related stories fetch
      }
    }

    fetchRelated();
  }, [article]);

  if (loading) {
    return (
      <div className="container">
        <ArticleDetailSkeleton />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container" style={{ paddingBlock: '5rem', textAlign: 'center' }}>
        <div className="empty-state">
          <Compass size={48} color="var(--brand-red)" />
          <h2 className="empty-title" style={{ fontFamily: 'var(--font-serif)', marginTop: '1rem' }}>Story Not Found</h2>
          <p className="empty-desc">
            The article you requested could not be located in the current wire index.
          </p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', background: 'var(--brand-red)', borderColor: 'var(--brand-red)' }}>
            <ArrowLeft size={16} />
            <span>Return to Headlines</span>
          </Link>
        </div>
      </div>
    );
  }

  const bookmarked = isBookmarked(article.url);
  const rawCat = (article.category || 'general').toLowerCase();
  const displayCategory = getDisplayCategory(rawCat);

  const heroImage = !imageFailed && article.imageUrl
    ? article.imageUrl
    : getEditorialImage(rawCat, article.title);

  const fullShareUrl = window.location.href;

  // Share Handlers
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      addToast('Story link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      addToast('Could not copy link.', 'error');
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${article.title} — via ANEWS`);
    const url = encodeURIComponent(fullShareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${article.title}\n\n${fullShareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="container">
      {/* Dynamic SEO & OpenGraph Meta Tags */}
      <Helmet>
        <title>{`${article.title} — ANEWS`}</title>
        <meta name="description" content={article.description || 'Full investigative coverage and publisher developments on ANEWS.'} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.description || 'Live coverage on ANEWS.'} />
        <meta property="og:image" content={heroImage} />
        <meta property="og:url" content={fullShareUrl} />
        <meta property="article:published_time" content={article.publishedAt} />
        <meta property="article:section" content={displayCategory} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.description || 'Live coverage on ANEWS.'} />
        <meta name="twitter:image" content={heroImage} />
      </Helmet>

      <article className="article-detail-container">
        {/* Back Link Bar */}
        <nav className="detail-nav-bar" aria-label="Article Breadcrumb">
          <button 
            onClick={() => navigate(-1)} 
            className="detail-back-btn"
            aria-label="Back to previous page"
          >
            <ArrowLeft size={16} />
            <span>Back to headlines</span>
          </button>

          <span className="tag-badge" style={{ color: 'var(--brand-red)' }}>
            {displayCategory}
          </span>
        </nav>

        {/* Article Headline Header */}
        <header className="detail-header">
          <h1 className="detail-headline">
            {article.title}
          </h1>

          {article.description && (
            <p className="detail-deck">
              {article.description}
            </p>
          )}

          {/* Metadata Row: Source Attribution, Relative & Formatted Date */}
          <div className="detail-meta-row">
            <div className="detail-source-badge">
              <Globe size={15} style={{ color: 'var(--brand-red)' }} />
              <span>{article.sourceName || 'Wire Service'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Clock size={14} />
              <span>Published {formatTimeAgo(article.publishedAt, true)}</span>
              {article.publishedAt && (
                <span style={{ opacity: 0.6 }}>
                  ({new Date(article.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })})
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Featured Editorial Imagery */}
        <figure style={{ margin: 0 }}>
          <div className="detail-hero-image-wrap">
            <img 
              src={heroImage} 
              alt={article.title} 
              className="detail-hero-image"
              fetchpriority="high"
              onError={() => {
                if (!imageFailed) setImageFailed(true);
              }}
            />
          </div>
          <figcaption className="detail-image-caption">
            Image credit: {article.sourceName || 'Wire Press Archive'} · Editorial illustration
          </figcaption>
        </figure>

        {/* Article Full Snippet / Synopsis Content */}
        <div className="detail-body-snippet">
          <p style={{ marginBottom: '1.5rem' }}>
            {article.description || 'Breaking news coverage continues to develop on this story. Full reporting and in-depth investigation are provided by the publishing wire.'}
          </p>
        </div>

        {/* Callout Card: Continue Reading Outbound CTA (Respecting reproduction copyright) */}
        <section className="continue-reading-card" aria-label="Original Article Reference">
          <p className="continue-reading-text">
            To respect publisher copyright and support independent investigative reporting, full unedited articles are hosted directly by the original source publication.
          </p>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="continue-reading-btn"
            title={`Read complete article on ${article.sourceName || 'source'}`}
          >
            <span>Continue reading at {article.sourceName || 'Original Source'}</span>
            <ExternalLink size={16} />
          </a>
        </section>

        {/* Action & Sharing Bar */}
        <footer className="article-share-bar">
          <div className="share-buttons-group">
            <button
              onClick={handleCopyLink}
              className="share-btn"
              title="Copy article link"
            >
              {copied ? <Check size={15} color="#10b981" /> : <Share2 size={15} />}
              <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleShareTwitter}
              className="share-btn"
              title="Share to X"
            >
              <Twitter size={15} style={{ color: '#1d9bf0' }} />
              <span>Share to X</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="share-btn"
              title="Share to WhatsApp"
            >
              <MessageCircle size={15} style={{ color: '#25d366' }} />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Bookmark Toggle */}
          <button
            onClick={() => toggleBookmark(article)}
            className="share-btn"
            style={{ 
              color: bookmarked ? 'var(--brand-red)' : 'inherit',
              borderColor: bookmarked ? 'var(--brand-red)' : 'var(--border-subtle)'
            }}
          >
            <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
            <span>{bookmarked ? 'Saved in Bookmarks' : 'Bookmark'}</span>
          </button>
        </footer>

        {/* Related Stories Section Rail */}
        {relatedArticles.length > 0 && (
          <section className="related-stories-wrap" aria-labelledby="related-heading">
            <h2 id="related-heading" className="related-stories-title">
              Related Stories in {displayCategory}
            </h2>
            <div className="section-rail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {relatedArticles.map((rel, idx) => (
                <NewsCard key={`${rel.url || idx}-related`} article={rel} />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
