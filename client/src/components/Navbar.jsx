/**
 * Main Navigation Bar & Live Utility Bar Component
 * 
 * Features:
 * - Secondary thin utility bar with live-updating digital clock and date ("Tuesday, 22 September 2026 · Live")
 * - Sticky editorial navbar in BBC/Reuters style with bold crimson branding
 * - Primary category links: Top Stories, Tech, Sports, Business, Science, World, More
 * - Light / Dark mode toggle switch (Sun / Moon)
 * - Language selector (EN / HI / TE) & Regional Edition dropdown
 * - Bookmarks counter badge & User authentication
 * - Fully accessible mobile drawer with smooth slide-out transition
 */

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Cpu,
  Trophy,
  TrendingUp,
  FlaskConical,
  HeartPulse,
  Film,
  Globe2,
  Bookmark,
  Search,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Compass,
  Sun,
  Moon,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../context/BookmarkContext';
import { useCountry } from '../context/CountryContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { bookmarkCount } = useBookmarks();
  const { country, setCountry, activeCountry, countries } = useCountry();
  const { theme, toggleTheme, isDark } = useTheme();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);

  // Live Date and Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  const userMenuRef = useRef(null);
  const moreMenuRef = useRef(null);
  const countryMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Tick clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close open popovers on route transition
  useEffect(() => {
    setUserMenuOpen(false);
    setMoreMenuOpen(false);
    setMobileMenuOpen(false);
    setCountryMenuOpen(false);
  }, [location.pathname]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setMoreMenuOpen(false);
      }
      if (countryMenuRef.current && !countryMenuRef.current.contains(event.target)) {
        setCountryMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isMoreCategoryActive = ['/health', '/entertainment', '/world'].includes(location.pathname);

  // Format dynamic live date string: e.g. "Tuesday, 22 September 2026"
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format dynamic clock string: e.g. "10:48:32 AM"
  const formattedClock = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <header className="site-header" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
      {/* 1. Thin Secondary Utility Bar */}
      <div className="utility-bar">
        <div className="container utility-inner">
          <div className="utility-left">
            <span>{formattedDate}</span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formattedClock}</span>
            <span className="live-badge">
              <span className="live-dot" />
              <span>LIVE</span>
            </span>
          </div>

          <div className="utility-right">
            <span style={{ opacity: 0.8 }}>Edition: <strong>{activeCountry.label}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Main Sticky Navbar */}
      <nav className="navbar" aria-label="Main Navigation">
        <div className="container navbar-inner">
          {/* Brand Logo - BBC/Reuters Editorial Style */}
          <Link to="/" className="nav-brand" aria-label="ANEWS Home">
            <div style={{ 
              background: 'var(--brand-red)', 
              color: '#ffffff', 
              fontWeight: 900, 
              fontSize: '1.25rem', 
              letterSpacing: '-0.03em', 
              padding: '2px 8px', 
              borderRadius: '2px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontFamily: 'var(--font-serif)'
            }}>
              A
            </div>
            <div className="brand-text-block">
              <span className="brand-title" style={{ fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>
                A<span style={{ color: 'var(--brand-red)' }}>NEWS</span>
              </span>
              <span className="brand-sub" style={{ letterSpacing: '0.08em', fontSize: '0.62rem' }}>
                GLOBAL EDITORIAL
              </span>
            </div>
          </Link>

          {/* Desktop Category Navigation */}
          <div className="nav-links" role="navigation">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              <span>Top Stories</span>
            </NavLink>

            <NavLink
              to="/tech"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span>Tech</span>
            </NavLink>

            <NavLink
              to="/sports"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span>Sports</span>
            </NavLink>

            <NavLink
              to="/business"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span>Business</span>
            </NavLink>

            <NavLink
              to="/science"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span>Science</span>
            </NavLink>

            <NavLink
              to="/world"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span>World</span>
            </NavLink>

            {/* "More" Categories Dropdown */}
            <div className="nav-dropdown" ref={moreMenuRef}>
              <button
                className={`nav-link ${isMoreCategoryActive ? 'active' : ''}`}
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                aria-expanded={moreMenuOpen}
                aria-haspopup="true"
              >
                <span>More</span>
                <ChevronDown size={13} style={{ transform: moreMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
              </button>

              {moreMenuOpen && (
                <div className="dropdown-menu" style={{ minWidth: '170px' }}>
                  <NavLink to="/health" className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}>
                    <HeartPulse size={15} style={{ color: 'var(--accent-health)' }} />
                    <span>Health</span>
                  </NavLink>
                  <NavLink to="/entertainment" className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}>
                    <Film size={15} style={{ color: 'var(--accent-entertainment)' }} />
                    <span>Entertainment</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* Bookmarks Nav Link */}
            <NavLink
              to="/saved"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title="Saved Bookmarks"
            >
              <Bookmark size={15} />
              <span>Saved</span>
              {bookmarkCount > 0 && (
                <span className="nav-badge" style={{ background: 'var(--brand-red)' }}>{bookmarkCount}</span>
              )}
            </NavLink>
          </div>

          {/* Right Actions: Search, Language, Theme, Edition, Auth */}
          <div className="nav-actions">
            {/* Quick Search Button */}
            <Link
              to="/search"
              className="btn btn-icon btn-ghost"
              title="Search news articles"
              aria-label="Search news articles"
            >
              <Search size={17} />
            </Link>

            {/* Language Selector Dropdown */}
            <LanguageSelector variant="dropdown" />

            {/* Regional Edition Selector */}
            <div className="country-menu-wrapper" ref={countryMenuRef} style={{ position: 'relative' }}>
              <button
                className="edition-pill-btn"
                onClick={() => setCountryMenuOpen(!countryMenuOpen)}
                title={`News Edition: ${activeCountry.label}`}
                aria-label="Select News Edition"
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>{activeCountry.flag}</span>
                <span className="edition-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>{activeCountry.code.toUpperCase()}</span>
                <ChevronDown size={11} style={{ transform: countryMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
              </button>

              {countryMenuOpen && (
                <div className="dropdown-menu edition-dropdown" style={{ right: 0, minWidth: '190px' }}>
                  <div style={{ padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.25rem' }}>
                    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
                      Regional Edition
                    </p>
                  </div>
                  {countries.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCountry(c.code);
                        setCountryMenuOpen(false);
                      }}
                      className={`dropdown-item ${country === c.code ? 'active' : ''}`}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>{c.flag}</span>
                        <span style={{ fontWeight: country === c.code ? 600 : 400 }}>{c.label}</span>
                      </div>
                      {c.isDefault && (
                        <span style={{ fontSize: '0.65rem', background: 'var(--brand-red)', color: '#fff', padding: '1px 5px', borderRadius: '2px', fontWeight: 700 }}>
                          DEFAULT
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle (Sun / Moon) */}
            <button
              onClick={toggleTheme}
              className="btn btn-icon btn-ghost theme-toggle-btn"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={17} style={{ color: '#f59e0b' }} /> : <Moon size={17} />}
            </button>

            {/* User Authentication State */}
            {isAuthenticated ? (
              <div className="user-menu" ref={userMenuRef}>
                <button
                  className="user-button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="user-avatar" style={{ background: 'var(--brand-red)' }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="desktop-user-name">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDown size={13} />
                </button>

                {userMenuOpen && (
                  <div className="dropdown-menu">
                    <div style={{ padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.25rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</p>
                    </div>
                    <Link to="/saved" className="dropdown-item">
                      <Bookmark size={15} />
                      <span>My Bookmarks ({bookmarkCount})</span>
                    </Link>
                    <button onClick={handleLogout} className="dropdown-item danger" style={{ width: '100%', textAlign: 'left' }}>
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="nav-auth-desktop">
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" style={{ background: 'var(--brand-red)', borderColor: 'var(--brand-red)' }}>
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* 3. Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="mobile-nav" role="dialog" aria-modal="true">
            {/* Mobile User/Auth Header */}
            <div className="mobile-auth-section">
              {isAuthenticated ? (
                <div className="mobile-user-card">
                  <div className="user-avatar" style={{ background: 'var(--brand-red)' }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0 }}>
                      {user?.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      {user?.email}
                    </p>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="btn btn-ghost btn-sm" 
                    title="Sign out"
                    style={{ color: 'var(--brand-red)', padding: '0.4rem 0.6rem' }}
                  >
                    <LogOut size={16} />
                    <span>Exit</span>
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-buttons">
                  <Link 
                    to="/login" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1 }}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-primary btn-sm" 
                    style={{ flex: 1, background: 'var(--brand-red)', borderColor: 'var(--brand-red)' }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            <NavLink
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              <Compass size={18} />
              <span>Top Stories</span>
            </NavLink>

            <NavLink
              to="/tech"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Cpu size={18} style={{ color: 'var(--accent-tech)' }} />
              <span>Technology</span>
            </NavLink>

            <NavLink
              to="/sports"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Trophy size={18} style={{ color: 'var(--accent-sports)' }} />
              <span>Sports</span>
            </NavLink>

            <NavLink
              to="/business"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <TrendingUp size={18} style={{ color: 'var(--accent-business)' }} />
              <span>Business</span>
            </NavLink>

            <NavLink
              to="/science"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <FlaskConical size={18} style={{ color: 'var(--accent-science)' }} />
              <span>Science</span>
            </NavLink>

            <NavLink
              to="/world"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Globe2 size={18} style={{ color: 'var(--accent-world)' }} />
              <span>World News</span>
            </NavLink>

            <NavLink
              to="/health"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <HeartPulse size={18} style={{ color: 'var(--accent-health)' }} />
              <span>Health</span>
            </NavLink>

            <NavLink
              to="/entertainment"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Film size={18} style={{ color: 'var(--accent-entertainment)' }} />
              <span>Entertainment</span>
            </NavLink>

            <NavLink
              to="/saved"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Bookmark size={18} />
              <span>Saved Articles ({bookmarkCount})</span>
            </NavLink>

            <NavLink
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Search size={18} />
              <span>Search Articles</span>
            </NavLink>

            {/* Mobile Language and Region Section */}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>
                CONTENT LANGUAGE
              </span>
              <LanguageSelector variant="buttons" onSelect={() => setMobileMenuOpen(false)} />
            </div>

            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>
                REGIONAL EDITION
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {countries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCountry(c.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`btn btn-sm ${country === c.code ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.6rem' }}
                  >
                    <span>{c.flag}</span>
                    <span>{c.label}</span>
                    {c.isDefault && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>(Default)</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
