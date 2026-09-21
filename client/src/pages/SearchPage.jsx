/**
 * SearchPage Component
 * 
 * Clean keyword search interface without category filters, supporting
 * pagination and dynamic URL parameter synchronization.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, AlertTriangle, Newspaper } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import NewsCard from '../components/NewsCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';
import { useCountry } from '../context/CountryContext';

export default function SearchPage() {
  const { country, activeCountry } = useCountry();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;

  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeSearch = async (q, page) => {
    const searchQuery = q || 'news';

    try {
      setLoading(true);
      setError(null);

      const response = await axiosClient.get('/news/search', {
        params: {
          q: searchQuery,
          country,
          page,
          pageSize: 12
        }
      });

      if (response.data.status === 'success') {
        setArticles(response.data.articles || []);
        setTotalResults(response.data.totalResults || 0);
      }
    } catch (err) {
      console.error('Search request failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to search articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch(queryParam, pageParam);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [queryParam, pageParam, country]);

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', newPage.toString());
    setSearchParams(nextParams);
  };

  return (
    <div className="container" style={{ paddingBlock: '2rem' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Search Articles
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Find specific coverage across thousands of indexed news releases.
        </p>

        <SearchBar initialQuery={queryParam} />
      </div>

      {/* Results Header Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {queryParam ? (
            <>Results for <strong style={{ color: 'var(--text-primary)' }}>"{queryParam}"</strong></>
          ) : (
            <>Latest News Coverage</>
          )}
          {' '}&bull; {totalResults.toLocaleString()} found
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-banner alert-error" role="alert">
          <AlertTriangle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Results Grid or Skeletons */}
      {loading ? (
        <LoadingSkeleton count={12} />
      ) : articles.length > 0 ? (
        <>
          <div className="news-grid">
            {articles.map((article, index) => (
              <NewsCard key={article.url || index} article={article} />
            ))}
          </div>

          <Pagination
            currentPage={pageParam}
            totalResults={totalResults}
            pageSize={12}
            onPageChange={handlePageChange}
          />
        </>
      ) : !loading && (
        <div className="empty-state">
          <Newspaper size={48} color="var(--text-muted)" />
          <h2 className="empty-title">No matching articles found</h2>
          <p className="empty-desc">
            We couldn't find any articles matching your search query. Try broader keywords like "tech", "India", or "sports".
          </p>
        </div>
      )}
    </div>
  );
}
