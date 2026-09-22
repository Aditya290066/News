/**
 * Real News - Client Application Root
 * 
 * Sets up:
 * - HelmetProvider for dynamic SEO and OpenGraph meta tags
 * - Global Context Providers (Theme, Auth, Toast, Bookmarks, Country, Language)
 * - Top-of-page YouTube-style loading bar
 * - React.lazy + Suspense route-level code splitting
 * - ErrorBoundary for graceful client recovery
 * - Layout structure (Sticky Navbar, Live Utility Bar, Footer)
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { CountryProvider } from './context/CountryContext';
import { LanguageProvider } from './context/LanguageContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import TopProgressBar from './components/TopProgressBar';
import ErrorBoundary from './components/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';

// Route Code-Splitting with React.lazy
const HomePage = lazy(() => import('./pages/HomePage'));
const CategoryNewsPage = lazy(() => import('./pages/CategoryNewsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const SavedArticlesPage = lazy(() => import('./pages/SavedArticlesPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BookmarkProvider>
              <CountryProvider>
                <LanguageProvider>
                  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
                    {/* Top Progress Bar on Route Transitions */}
                    <TopProgressBar />

                    {/* Live Utility Bar & Sticky Main Navbar */}
                    <Navbar />

                    <main>
                      <ErrorBoundary>
                        <Suspense fallback={<div className="container" style={{ paddingBlock: '3rem' }}><TopProgressBar loading={true} /></div>}>
                          <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/tech" element={<CategoryNewsPage category="technology" />} />
                            <Route path="/sports" element={<CategoryNewsPage category="sports" />} />
                            <Route path="/business" element={<CategoryNewsPage category="business" />} />
                            <Route path="/science" element={<CategoryNewsPage category="science" />} />
                            <Route path="/health" element={<CategoryNewsPage category="health" />} />
                            <Route path="/entertainment" element={<CategoryNewsPage category="entertainment" />} />
                            <Route path="/world" element={<CategoryNewsPage category="world" />} />
                            <Route path="/search" element={<SearchPage />} />
                            <Route 
                              path="/saved" 
                              element={
                                <ProtectedRoute>
                                  <SavedArticlesPage />
                                </ProtectedRoute>
                              } 
                            />
                            {/* In-app Article Detail Routes */}
                            <Route path="/article/:id" element={<ArticleDetailPage />} />
                            <Route path="/article" element={<ArticleDetailPage />} />

                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="*" element={<NotFoundPage />} />
                          </Routes>
                        </Suspense>
                      </ErrorBoundary>
                    </main>

                    <Footer />
                    <Analytics />
                  </div>
                </LanguageProvider>
              </CountryProvider>
            </BookmarkProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
