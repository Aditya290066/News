/**
 * Real News - Client Application Root
 * 
 * Sets up global Context Providers (Theme, Auth, Toast, Bookmarks),
 * Layout structure (Navbar & Footer), and React Router routes for all 7 news categories.
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { CountryProvider } from './context/CountryContext';
import { LanguageProvider } from './context/LanguageContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { Analytics } from '@vercel/analytics/react';

import HomePage from './pages/HomePage';
import CategoryNewsPage from './pages/CategoryNewsPage';
import SearchPage from './pages/SearchPage';
import SavedArticlesPage from './pages/SavedArticlesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BookmarkProvider>
            <CountryProvider>
              <LanguageProvider>
                <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
                  <Navbar />
                  <main>
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
                      <Route path="/article" element={<ArticleDetailPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
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
  );
}
