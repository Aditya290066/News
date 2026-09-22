/**
 * HomePage Component - BBC / Reuters Editorial Grade
 * 
 * Layout Architecture:
 * 1. Breaking News Banner (dismissible, top urgent accent if story published < 30 mins)
 * 2. Editorial Desk (Above the Fold):
 *    - Left/Main Column:
 *      * Lead / Hero Story: large 16:9 featured image (fetchpriority="high"), serif headline, deck synopsis
 *      * Secondary Stories: 2-3 medium cards beside/below hero
 *    - Right Column (Sidebar):
 *      * "Trending Now": ranked #1-5 numbered list with bold typography
 *      * "Latest Updates" Live Ticker: auto-polls every 75s with live indicator
 * 3. Section Rails (Below the Fold):
 *    - Horizontal categorized rails (Technology, Sports, Business, World) with "See all" links
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Cpu, Trophy, TrendingUp, Globe2, RefreshCw, AlertTriangle, Layers } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useCountry } from '../context/CountryContext';
import { useLanguage } from '../context/LanguageContext';

import BreakingNewsBanner from '../components/BreakingNewsBanner';
import HeroStory from '../components/HeroStory';
import SecondaryStories from '../components/SecondaryStories';
import SidebarTrending from '../components/SidebarTrending';
import SidebarLiveTicker from '../components/SidebarLiveTicker';
import SectionRail from '../components/SectionRail';
import { HeroSkeleton, SecondarySkeleton, SidebarSkeleton, RailSkeleton } from '../components/LoadingSkeleton';

export default function HomePage() {
  const { country, activeCountry } = useCountry();
  const { language, activeLanguage } = useLanguage();

  const [mainFeed, setMainFeed] = useState([]);
  const [techNews, setTechNews] = useState([]);
  const [sportsNews, setSportsNews] = useState([]);
  const [businessNews, setBusinessNews] = useState([]);
  const [worldNews, setWorldNews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStaleFallback, setIsStaleFallback] = useState(false);

  const fetchEditorialHome = async () => {
    try {
      setLoading(true);
      setError(null);

      // Primary mixed feed for Hero, Secondary, Trending, and Ticker
      const mainPromise = axiosClient.get('/news', {
        params: { category: 'all', country, lang: language, page: 1, pageSize: 16 }
      });

      // Fetch category rails in parallel (reads directly from server cache)
      const techPromise = axiosClient.get('/news', {
        params: { category: 'technology', country, lang: language, page: 1, pageSize: 4 }
      });

      const sportsPromise = axiosClient.get('/news', {
        params: { category: 'sports', country, lang: language, page: 1, pageSize: 4 }
      });

      const businessPromise = axiosClient.get('/news', {
        params: { category: 'business', country, lang: language, page: 1, pageSize: 4 }
      });

      const worldPromise = axiosClient.get('/news', {
        params: { category: 'world', country, lang: language, page: 1, pageSize: 4 }
      });

      const [mainRes, techRes, sportsRes, businessRes, worldRes] = await Promise.allSettled([
        mainPromise,
        techPromise,
        sportsPromise,
        businessPromise,
        worldPromise
      ]);

      if (techRes.status === 'fulfilled' && techRes.value.data?.status === 'success') {
        setTechNews(techRes.value.data.articles || []);
      }
      if (sportsRes.status === 'fulfilled' && sportsRes.value.data?.status === 'success') {
        setSportsNews(sportsRes.value.data.articles || []);
      }
      if (businessRes.status === 'fulfilled' && businessRes.value.data?.status === 'success') {
        setBusinessNews(businessRes.value.data.articles || []);
      }
      if (worldRes.status === 'fulfilled' && worldRes.value.data?.status === 'success') {
        setWorldNews(worldRes.value.data.articles || []);
      }

      if (mainRes.status === 'fulfilled' && mainRes.value.data?.status === 'success' && Array.isArray(mainRes.value.data.articles) && mainRes.value.data.articles.length > 0) {
        const fetched = mainRes.value.data.articles;
        setMainFeed(fetched);
        setIsStaleFallback(!!mainRes.value.data.staleFallback);
      } else {
        // Collect articles from whichever categories succeeded
        const alternateArticles = [
          ...(techRes.status === 'fulfilled' && techRes.value.data?.articles ? techRes.value.data.articles : []),
          ...(businessRes.status === 'fulfilled' && businessRes.value.data?.articles ? businessRes.value.data.articles : []),
          ...(worldRes.status === 'fulfilled' && worldRes.value.data?.articles ? worldRes.value.data.articles : []),
          ...(sportsRes.status === 'fulfilled' && sportsRes.value.data?.articles ? sportsRes.value.data.articles : [])
        ];

        if (alternateArticles.length > 0) {
          setMainFeed(alternateArticles);
          setIsStaleFallback(true);
        } else {
          throw new Error(mainRes.reason?.response?.data?.message || 'Failed to fetch headlines.');
        }
      }
    } catch (err) {
      console.error('Failed to load editorial homepage:', err);
      setError(err.response?.data?.message || err.message || 'Unable to connect to news wire.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEditorialHome();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [country, language]);

  // Information hierarchy partition
  const heroStory = mainFeed[0] || null;
  const secondaryStories = mainFeed.slice(1, 4);
  const trendingStories = mainFeed.slice(0, 5);
  const tickerStories = mainFeed.slice(4, 10);

  // Fallbacks for rails if category endpoints returned fewer items
  const displayTech = techNews.length > 0 ? techNews : mainFeed.filter(a => (a.category || '').toLowerCase().includes('tech')).slice(0, 4);
  const displaySports = sportsNews.length > 0 ? sportsNews : mainFeed.filter(a => (a.category || '').toLowerCase().includes('sport')).slice(0, 4);
  const displayBusiness = businessNews.length > 0 ? businessNews : mainFeed.filter(a => (a.category || '').toLowerCase().includes('busin')).slice(0, 4);
  const displayWorld = worldNews.length > 0 ? worldNews : mainFeed.filter(a => (a.category || '').toLowerCase().includes('world') || (a.category || '').toLowerCase().includes('gen')).slice(0, 4);

  return (
    <div className="home-page-root">
      <Helmet>
        <title>ANEWS — Global Breaking News, Markets & Analysis</title>
        <meta name="description" content="Live investigative reporting, technological innovation, global financial markets, and world sports updates in BBC News & Reuters editorial format." />
        <meta property="og:title" content="ANEWS — Global Breaking News & Editorial Coverage" />
        <meta property="og:description" content="Verified breaking news from international wires and Indian correspondent networks." />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* 1. Breaking News Banner (Dismissible) */}
      {!loading && mainFeed.length > 0 && (
        <BreakingNewsBanner articles={mainFeed} />
      )}

      <div className="container">
        {/* Error State Banner */}
        {error && (
          <div className="alert-banner alert-danger" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
            <button 
              onClick={fetchEditorialHome} 
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
          <div className="alert-banner alert-warning" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={18} />
              <span>
                External news wire rate limit reached. Displaying latest cached snapshot while external rate limits reset.
              </span>
            </div>
            <button 
              onClick={fetchEditorialHome} 
              className="btn btn-secondary btn-sm"
              style={{ color: '#fff', borderColor: 'currentColor' }}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        )}

        {/* Section Header Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: 'var(--brand-red)' }}>
              Top Stories
            </span>
            <span style={{ color: 'var(--border-subtle)' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Edition: {activeCountry.label} {language !== 'en' && `(${activeLanguage.label})`}
            </span>
          </div>

          <button 
            onClick={fetchEditorialHome} 
            className="btn btn-ghost btn-sm"
            title="Refresh news feed"
            style={{ fontSize: '0.78rem' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Update Feed</span>
          </button>
        </div>

        {/* 2. Editorial Desk Grid (Above the Fold) */}
        {loading ? (
          <div className="editorial-desk">
            <div className="editorial-lead-col">
              <HeroSkeleton />
              <SecondarySkeleton count={3} />
            </div>
            <SidebarSkeleton />
          </div>
        ) : heroStory ? (
          <div className="editorial-desk">
            {/* Left/Main Column: Lead Story + Secondary Stories */}
            <div className="editorial-lead-col">
              <HeroStory article={heroStory} />
              <SecondaryStories articles={secondaryStories} />
            </div>

            {/* Right Column: Trending Now (#1-5) + Live Ticker */}
            <aside className="editorial-sidebar" aria-label="Editorial Sidebar">
              <SidebarTrending articles={trendingStories} />
              <SidebarLiveTicker initialArticles={tickerStories.length > 0 ? tickerStories : mainFeed.slice(0, 6)} />
            </aside>
          </div>
        ) : (
          <div className="empty-state" style={{ paddingBlock: '4rem' }}>
            <Layers size={36} color="var(--text-muted)" />
            <h3 className="empty-title">No Headlines Available</h3>
            <p className="empty-desc">
              We were unable to load stories for this edition. Please check your network connection or try refreshing.
            </p>
            <button onClick={fetchEditorialHome} className="btn btn-primary" style={{ marginTop: '1rem', background: 'var(--brand-red)' }}>
              <RefreshCw size={15} />
              <span>Retry Loading</span>
            </button>
          </div>
        )}

        {/* 3. Section Rails (Below the Fold) */}
        {loading ? (
          <>
            <RailSkeleton />
            <RailSkeleton />
          </>
        ) : (
          <div className="section-rails-container">
            {displayTech.length > 0 && (
              <SectionRail
                title="Technology"
                categoryPath="/tech"
                icon={Cpu}
                articles={displayTech}
              />
            )}

            {displayBusiness.length > 0 && (
              <SectionRail
                title="Business & Markets"
                categoryPath="/business"
                icon={TrendingUp}
                articles={displayBusiness}
              />
            )}

            {displaySports.length > 0 && (
              <SectionRail
                title="Sports"
                categoryPath="/sports"
                icon={Trophy}
                articles={displaySports}
              />
            )}

            {displayWorld.length > 0 && (
              <SectionRail
                title="World News"
                categoryPath="/world"
                icon={Globe2}
                articles={displayWorld}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
