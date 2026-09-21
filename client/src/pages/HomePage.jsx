/**
 * HomePage Component
 * 
 * Displays the curated mixed feed of latest Technology and Sports headlines.
 * Includes a hero banner, search shortcut, news card grid, and pagination.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, RefreshCw, AlertTriangle, Search, Languages } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import NewsCard from '../components/NewsCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Pagination from '../components/Pagination';
import { useCountry } from '../context/CountryContext';
import { useLanguage } from '../context/LanguageContext';

export default function HomePage() {
  const { country } = useCountry();
  const { language, activeLanguage, setLanguage } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStaleFallback, setIsStaleFallback] = useState(false);

  const fetchNews = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosClient.get('/news', {
        params: {
          category: 'all',
          country,
          lang: language,
          page: pageNum,
          pageSize: 12
        }
      });

      if (response.data.status === 'success') {
        setArticles(response.data.articles || []);
        setTotalResults(response.data.totalResults || 0);
        setIsStaleFallback(!!response.data.staleFallback);
      }
    } catch (err) {
      console.error('Failed to load home news feed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch news articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, country, language]);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="container hero-content">
          <h1 className="hero-title">
            The pulse of Technology, Markets & World Sports, unfiltered.
          </h1>
          <p className="hero-subtitle">
            Curated breaking stories from Indian & international wires. Save key reports, follow live developments, and explore comprehensive coverage.
          </p>
          <div>
            <Link 
              to="/search" 
              className="hero-search-pill" 
              title="Search news articles"
              aria-label="Search news articles"
            >
              <Search size={16} />
              <span>Search headlines...</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main News Section */}
      <div className="container" style={{ paddingBlock: '2.5rem' }}>
        {/* Error Banner */}
        {error && (
          <div className="alert-banner alert-danger">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => fetchNews(page)} 
              className="btn btn-secondary btn-sm"
              style={{ color: '#fff', borderColor: 'currentColor' }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Stale Cache Notice */}
        {isStaleFallback && (
          <div className="alert-banner alert-warning">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={18} />
              <span>
                External news feed rate limit reached. Displaying latest cached snapshot while external rate limits reset.
              </span>
            </div>
            <button 
              onClick={() => fetchNews(page)} 
              className="btn btn-secondary btn-sm"
              style={{ color: '#fff', borderColor: 'currentColor' }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700 }}>
              Latest Mixed Headlines
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Interleaved coverage across Tech innovations & Sports tournaments
              {language !== 'en' && (
                <span style={{ marginLeft: '0.5rem', fontWeight: 600, color: 'var(--accent-tech)' }}>
                  &bull; {activeLanguage.nativeLabel} ({activeLanguage.label})
                </span>
              )}
            </p>
          </div>

          <button 
            onClick={() => fetchNews(page)} 
            className="btn btn-ghost btn-sm"
            title="Refresh news feed"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Low Coverage Notification (When language is Hindi/Telugu and returns 1-2 articles) */}
        {!loading && language !== 'en' && articles.length > 0 && articles.length < 3 && (
          <div className="alert-banner" style={{ background: 'var(--accent-tech-bg)', borderColor: 'var(--accent-tech-border)', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Languages size={18} style={{ color: 'var(--accent-tech)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.88rem' }}>
                Limited {activeLanguage.label} coverage: showing <strong>{articles.length}</strong> available story. Check back later or browse in English.
              </span>
            </div>
            <button onClick={() => setLanguage('en')} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-tech)', fontWeight: 600 }}>
              View in English
            </button>
          </div>
        )}

        {/* Articles Grid or Loading Skeletons */}
        {loading ? (
          <LoadingSkeleton count={12} />
        ) : articles.length > 0 ? (
          <>
            <div className="news-grid">
              {articles.map((article, index) => (
                <NewsCard key={`${article.url}-${index}`} article={article} />
              ))}
            </div>

            <Pagination 
              currentPage={page} 
              totalResults={totalResults} 
              pageSize={12} 
              onPageChange={(newPage) => setPage(newPage)} 
            />
          </>
        ) : language !== 'en' ? (
          /* Tailored Multilingual Empty State (Req 4) */
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'var(--accent-tech-bg)', color: 'var(--accent-tech)' }}>
              <Languages size={32} />
            </div>
            <h3 className="empty-title">
              Limited {activeLanguage.label} coverage available for this category right now
            </h3>
            <p className="empty-desc">
              News sources in {activeLanguage.label} ({activeLanguage.nativeLabel}) currently have limited stories in this feed. Try Top Stories or switch to English.
            </p>
            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setLanguage('en')} 
                className="btn btn-primary btn-sm"
              >
                Switch to English
              </button>
              <button 
                onClick={() => fetchNews(1)} 
                className="btn btn-secondary btn-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Newspaper size={32} />
            </div>
            <h3 className="empty-title">No Headlines Found</h3>
            <p className="empty-desc">
              We couldn't find any news articles right now. Please check back shortly or verify your NewsAPI key setup.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
