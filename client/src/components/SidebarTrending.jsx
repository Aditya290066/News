/**
 * SidebarTrending Component
 * 
 * Editorial "Most Read" / "Trending Now" ranked 1-5 list
 * featuring bold typographic numbers and serif headlines.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock } from 'lucide-react';
import { getArticleId, formatTimeAgo } from '../utils/articleUtils';

export default function SidebarTrending({ articles = [] }) {
  // Take top 5 stories
  const trendingArticles = (articles || []).slice(0, 5);

  if (trendingArticles.length === 0) return null;

  return (
    <div className="sidebar-trending-block">
      <h3 className="sidebar-widget-title">
        <span>Trending Now</span>
        <TrendingUp size={15} style={{ color: 'var(--brand-red)' }} />
      </h3>

      <ol className="trending-list">
        {trendingArticles.map((article, index) => {
          const rank = String(index + 1).padStart(2, '0');
          const articleId = getArticleId(article);

          return (
            <li key={`${article.url || index}-trend`} className="trending-item">
              <span className="trending-rank">{rank}</span>
              <div className="trending-item-content">
                <h4 className="trending-item-title" title={article.title}>
                  <Link
                    to={`/article/${articleId}`}
                    state={{ article }}
                  >
                    {article.title}
                  </Link>
                </h4>
                <div className="trending-item-meta">
                  <span style={{ fontWeight: 600 }}>{article.sourceName || 'News Wire'}</span>
                  <span style={{ marginInline: '0.35rem', opacity: 0.5 }}>•</span>
                  <span>{formatTimeAgo(article.publishedAt)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
