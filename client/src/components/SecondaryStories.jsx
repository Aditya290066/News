/**
 * SecondaryStories Component
 * 
 * Renders 2-3 medium-sized editorial stories positioned beside or below
 * the lead Hero story on the editorial home page.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { getEditorialImage } from '../utils/imageUtils';
import { getArticleId, formatTimeAgo, getDisplayCategory } from '../utils/articleUtils';

function SecondaryCard({ article }) {
  const [imageFailed, setImageFailed] = useState(false);
  const rawCat = (article.category || 'general').toLowerCase();
  const articleId = getArticleId(article);

  const displayImage = !imageFailed && article.imageUrl
    ? article.imageUrl
    : getEditorialImage(rawCat, article.title);

  return (
    <article className="secondary-card">
      <Link
        to={`/article/${articleId}`}
        state={{ article }}
        className="secondary-image-wrap"
      >
        <img
          src={displayImage}
          alt={article.title}
          className="secondary-image"
          loading="lazy"
          onError={() => {
            if (!imageFailed) setImageFailed(true);
          }}
        />
      </Link>

      <span className="tag-badge" style={{ color: 'var(--brand-red)', alignSelf: 'flex-start' }}>
        {getDisplayCategory(rawCat)}
      </span>

      <h3 className="secondary-title" title={article.title}>
        <Link
          to={`/article/${articleId}`}
          state={{ article }}
        >
          {article.title}
        </Link>
      </h3>

      <div className="secondary-meta">
        <Clock size={12} />
        <span>{formatTimeAgo(article.publishedAt)}</span>
        <span style={{ opacity: 0.4 }}>•</span>
        <span style={{ fontWeight: 600 }}>{article.sourceName || 'News Wire'}</span>
      </div>
    </article>
  );
}

export default function SecondaryStories({ articles = [] }) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="secondary-stories-grid">
      {articles.map((article, idx) => (
        <SecondaryCard key={`${article.url || idx}-${idx}`} article={article} />
      ))}
    </div>
  );
}
