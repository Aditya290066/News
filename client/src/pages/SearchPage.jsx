/**
 * SearchPage Component
 * 
 * Keyword search interface supporting topic filtering, pagination,
 * and dynamic URL parameter synchronization.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, AlertTriangle, Newspaper } from 'lucide-react';
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
  const categoryParam = searchParams.get('category') || 'all';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;

  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeSearch = async (q, cat, page) => {
    // If neither query nor category is set, default to searching technology
    const searchQuery = q || (cat === 'all' ? 'technology' : '');

    try {
      setLoading(true);
      setError(null);

      const response = await axiosClient.get('/news/search', {
        params: {
          q: searchQuery,
          category: cat !== 'all' ? cat : undefined,
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
    executeSearch(queryParam, categoryParam, pageParam);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [queryParam, categoryParam, pageParam, country]);

  const handleCategoryFilter = (newCategory) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newCategory === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', newCategory);
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', newPage.toString());
    setSearchParams(nextParams);
  };

  return (
    <div className="container" style={{ paddingBlock: '2.5rem' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Search Articles
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Find specific coverage across thousands of indexed news releases.
        </p>

        <SearchBar 
          initialQuery={queryParam} 
          initialCategory={categoryParam} 
        />

        {/* Quick Topic Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={14} /> Filter:
          </span>
          <button
            className={`btn btn-sm ${categoryParam === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleCategoryFilter('all')}
          >
            All Topics
          </button>
          <button
            className={`btn btn-sm ${categoryParam === 'technology' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleCategoryFilter('technology')}
          >
            Technology
          </button>
          <button
            className={`btn btn-sm ${categoryParam === 'sports' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleCategoryFilter('sports')}
          >
            Sports
          </button>
        </div>
      </div>

      {/* Results Header Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {queryParam ? (
            <>Results for <strong style={{ color: 'var(--text-primary)' }}>"{queryParam}"</strong></>
          ) : (
            <>Browsing <strong style={{ color: 'var(--text-primary)' }}>{categoryParam}</strong> news</>
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
              <NewsCard key={`${article.url}-${index}`} article={article} />
            ))}
          </div>

          <Pagination 
            currentPage={pageParam} 
            totalResults={totalResults} 
            pageSize={12} 
            onPageChange={handlePageChange} 
          />
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Search size={32} />
          </div>
          <h3 className="empty-title">No Matching Stories Found</h3>
          <p className="empty-desc">
            Try adjusting your search terms or choosing a different category filter.
          </p>
        </div>
      )}
    </div>
  );
}
