/**
 * BreakingNewsBanner Component
 * 
 * Dismissible top banner in BBC urgent red that displays if a story
 * was published within the last 30 minutes or carries breaking news importance.
 * Remembers user dismissal during the session via sessionStorage.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight, Zap } from 'lucide-react';
import { getArticleId } from '../utils/articleUtils';

export default function BreakingNewsBanner({ articles = [] }) {
  const [dismissed, setDismissed] = useState(false);
  const [breakingStory, setBreakingStory] = useState(null);

  useEffect(() => {
    // Check session storage
    if (sessionStorage.getItem('dismissed_breaking_news')) {
      setDismissed(true);
      return;
    }

    if (!articles || articles.length === 0) {
      setBreakingStory(null);
      return;
    }

    const now = new Date().getTime();
    const thirtyMinutesMs = 30 * 60 * 1000;

    // Look for story published within last 30 minutes
    const recent = articles.find((art) => {
      if (!art || !art.publishedAt) return false;
      const pubTime = new Date(art.publishedAt).getTime();
      return (now - pubTime) <= thirtyMinutesMs;
    });

    // If a very recent story exists, display it as breaking news
    if (recent) {
      setBreakingStory(recent);
    } else {
      setBreakingStory(null);
    }
  }, [articles]);

  if (dismissed || !breakingStory) return null;

  const articleId = getArticleId(breakingStory);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('dismissed_breaking_news', 'true');
  };

  return (
    <div className="breaking-banner" role="alert" aria-live="assertive">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div className="breaking-content">
          <span className="breaking-pill">
            <Zap size={10} style={{ display: 'inline', marginRight: '3px', verticalAlign: '-1px' }} />
            BREAKING
          </span>
          <p className="breaking-title" title={breakingStory.title}>
            {breakingStory.title}
          </p>
          <Link
            to={`/article/${articleId}`}
            state={{ article: breakingStory }}
            className="breaking-link"
          >
            <span>Read Live</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <button
          onClick={handleDismiss}
          className="breaking-close"
          title="Dismiss breaking news banner"
          aria-label="Dismiss breaking news banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
