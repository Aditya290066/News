/**
 * SportsNewsPage Component
 * 
 * Dedicated sports headlines feed featuring tournaments, match results,
 * transfers, and athletic highlights with green branding.
 */

import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, AlertTriangle, Newspaper } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import NewsCard from '../components/NewsCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Pagination from '../components/Pagination';

export default function SportsNewsPage() {
  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSportsNews = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosClient.get('/news', {
        params: {
          category: 'sports',
          page: pageNum,
          pageSize: 12
        }
      });

      if (response.data.status === 'success') {
        setArticles(response.data.articles || []);
        setTotalResults(response.data.totalResults || 0);
      }
    } catch (err) {
      console.error('Failed to load sports news:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch sports news.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSportsNews(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  return (
    <div className="container" style={{ paddingBlock: '2.5rem' }}>
      {/* Category Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            className="brand-icon" 
            style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #059669, #10b981)' }}
          >
            <Trophy size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800 }}>
                Sports News
              </h1>
              <span className="tag-badge tag-sports">Sports Feed</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Scores, transfers, championships, and athletic analysis across global leagues.
            </p>
          </div>
        </div>

        <button 
          onClick={() => fetchSportsNews(page)} 
          className="btn btn-secondary btn-sm"
          title="Refresh sports articles"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-banner alert-error" role="alert">
          <AlertTriangle size={18} />
          <div style={{ flex: 1 }}>{error}</div>
          <button onClick={() => fetchSportsNews(page)} className="btn btn-secondary btn-sm">
            Retry
          </button>
        </div>
      )}

      {/* Grid or Skeletons */}
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
          <h3 className="empty-title">No Sports Articles Found</h3>
          <p className="empty-desc">
            Check back in a few minutes or verify your NewsAPI connection.
          </p>
        </div>
      )}
    </div>
  );
}
