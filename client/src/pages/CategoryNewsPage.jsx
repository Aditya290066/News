/**
 * CategoryNewsPage Component
 * 
 * Versatile news feed component powering individual topic feeds:
 * Technology, Sports, Business, Science, Health, Entertainment, and World.
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Trophy, 
  TrendingUp, 
  FlaskConical, 
  HeartPulse, 
  Film, 
  Globe2, 
  RefreshCw, 
  AlertTriangle, 
  Newspaper 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import NewsCard from '../components/NewsCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Pagination from '../components/Pagination';

// Metadata configurations for each category
const CATEGORY_META = {
  tech: {
    title: 'Technology News',
    badge: 'Tech Wire',
    tagClass: 'tag-tech',
    icon: Cpu,
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    desc: 'Artificial intelligence, enterprise cloud, semiconductor chips, and developer breakthroughs.'
  },
  technology: {
    title: 'Technology News',
    badge: 'Tech Wire',
    tagClass: 'tag-tech',
    icon: Cpu,
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    desc: 'Artificial intelligence, enterprise cloud, semiconductor chips, and developer breakthroughs.'
  },
  sports: {
    title: 'Sports News',
    badge: 'Sports Wire',
    tagClass: 'tag-sports',
    icon: Trophy,
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    desc: 'Scores, athletic tournaments, championships, and major league reporting.'
  },
  business: {
    title: 'Business & Markets',
    badge: 'Markets Wire',
    tagClass: 'tag-business',
    icon: TrendingUp,
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    desc: 'Global equity markets, central bank policies, startup funding, and macroeconomics.'
  },
  science: {
    title: 'Science & Cosmos',
    badge: 'Science Wire',
    tagClass: 'tag-science',
    icon: FlaskConical,
    gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
    desc: 'Space exploration, astrophysics discoveries, quantum physics, and environmental research.'
  },
  health: {
    title: 'Health & Medicine',
    badge: 'Health Wire',
    tagClass: 'tag-health',
    icon: HeartPulse,
    gradient: 'linear-gradient(135deg, #e11d48, #f43f5e)',
    desc: 'Clinical breakthroughs, healthcare research, biotechnology, and public wellness updates.'
  },
  entertainment: {
    title: 'Arts & Entertainment',
    badge: 'Entertainment Wire',
    tagClass: 'tag-entertainment',
    icon: Film,
    gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
    desc: 'Cinema, music, streaming releases, culture festivals, and creative industry news.'
  },
  world: {
    title: 'World Headlines',
    badge: 'World Wire',
    tagClass: 'tag-world',
    icon: Globe2,
    gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    desc: 'International diplomacy, geopolitical developments, and global correspondent reports.'
  }
};

import { useCountry } from '../context/CountryContext';

export default function CategoryNewsPage({ category = 'technology' }) {
  const { country, activeCountry } = useCountry();
  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const meta = CATEGORY_META[category.toLowerCase()] || CATEGORY_META.tech;
  const CategoryIcon = meta.icon;

  const fetchCategoryNews = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosClient.get('/news', {
        params: {
          category,
          country,
          page: pageNum,
          pageSize: 12
        }
      });

      if (response.data.status === 'success') {
        setArticles(response.data.articles || []);
        setTotalResults(response.data.totalResults || 0);
      }
    } catch (err) {
      console.error(`Failed to load ${category} news:`, err);
      setError(err.response?.data?.message || err.message || `Failed to fetch ${meta.title}.`);
    } finally {
      setLoading(false);
    }
  };

  // Reset page and reload when category or country changes
  useEffect(() => {
    setPage(1);
    fetchCategoryNews(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category, country]);

  // Load new page
  useEffect(() => {
    fetchCategoryNews(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  return (
    <div className="container" style={{ paddingBlock: '2.5rem' }}>
      {/* Category Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
          <div 
            className="brand-icon" 
            style={{ width: '52px', height: '52px', borderRadius: '14px', background: meta.gradient }}
          >
            <CategoryIcon size={28} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800 }}>
                {meta.title}
              </h1>
              <span className={`tag-badge ${meta.tagClass}`}>
                {meta.badge}
              </span>
              <span className="tag-badge" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>
                {activeCountry.flag} {activeCountry.label}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.2rem' }}>
              {meta.desc}
            </p>
          </div>
        </div>

        <button 
          onClick={() => fetchCategoryNews(page)} 
          className="btn btn-secondary btn-sm"
          title="Refresh category articles"
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
          <button onClick={() => fetchCategoryNews(page)} className="btn btn-secondary btn-sm">
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
          <h3 className="empty-title">No Articles Found</h3>
          <p className="empty-desc">
            Check back in a few minutes or try another category.
          </p>
        </div>
      )}
    </div>
  );
}
