/**
 * HomePage Component
 * 
 * Displays the curated mixed feed of latest Technology and Sports headlines.
 * Includes a hero banner, search shortcut, news card grid, and pagination.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import NewsCard from '../components/NewsCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Pagination from '../components/Pagination';
import { useCountry } from '../context/CountryContext';

export default function HomePage() {
  const { country } = useCountry();
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
  }, [page, country]);

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
              className="btn btn-icon btn-ghost" 
              title="Search news articles"
              aria-label="Search news articles"
            >
              <Search size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container" style={{ paddingBlock: '2rem' }}>
        {/* Stale Cache Notice Banner */}
        {isStaleFallback && (
          <div className="alert-banner alert-warning" role="alert">
            <AlertTriangle size={18} />
            <div>
              <strong>Cached Feed Displayed:</strong> Real-time API rate limit reached or service temporarily busy. Serving our high-speed MySQL cached feed.
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert-banner alert-error" role="alert">
            <AlertTriangle size={18} />
            <div style={{ flex: 1 }}>
              <strong>Could not load articles:</strong> {error}
            </div>
            <button 
              onClick={() => fetchNews(page)} 
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: 'auto' }}
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
