/**
 * SidebarLiveTicker Component
 * 
 * Live ticker-style stream displaying the most recent headlines with timestamps.
 * Polls the backend silently every 75 seconds without triggering a full page reload or UI jump.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useCountry } from '../context/CountryContext';
import { useLanguage } from '../context/LanguageContext';
import { getArticleId, formatTimeAgo } from '../utils/articleUtils';

export default function SidebarLiveTicker({ initialArticles = [] }) {
  const { country } = useCountry();
  const { language } = useLanguage();
  const [tickerArticles, setTickerArticles] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      setTickerArticles(initialArticles.slice(0, 6));
    }
  }, [initialArticles]);

  // Background silent polling every 75 seconds (between 60 and 90 seconds)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axiosClient.get('/news', {
          params: {
            category: 'all',
            country,
            lang: language,
            page: 1,
            pageSize: 6
          }
        });

        if (response.data?.status === 'success' && response.data.articles?.length > 0) {
          setTickerArticles(response.data.articles.slice(0, 6));
          setLastUpdated(new Date());
        }
      } catch (err) {
        // Silent failure in background - preserves existing feed without disruption
      }
    }, 75000); // 75 seconds

    return () => clearInterval(pollInterval);
  }, [country, language]);

  if (!tickerArticles || tickerArticles.length === 0) return null;

  return (
    <div className="live-ticker-box">
      <div className="live-ticker-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span className="live-dot" />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--brand-red)' }}>
            Latest Updates
          </span>
        </div>
        <span className="ticker-status-text">
          {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="live-ticker-items">
        {tickerArticles.map((article, idx) => {
          const articleId = getArticleId(article);

          return (
            <article key={`${article.url || idx}-ticker`} className="live-ticker-entry">
              <span className="live-ticker-time">
                {formatTimeAgo(article.publishedAt)}
              </span>
              <h4 className="live-ticker-title" title={article.title}>
                <Link
                  to={`/article/${articleId}`}
                  state={{ article }}
                >
                  {article.title}
                </Link>
              </h4>
            </article>
          );
        })}
      </div>
    </div>
  );
}
