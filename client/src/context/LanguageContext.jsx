/**
 * Language Context
 * 
 * Manages the active content language across the application:
 * - English ('en', default)
 * - Hindi ('hi', हिन्दी)
 * - Telugu ('te', తెలుగు)
 * 
 * Persists selection in localStorage ('real_news_language') and exposes
 * language code, setter, and active language metadata.
 */

import React, { createContext, useContext, useState } from 'react';

export const SUPPORTED_LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    short: 'EN',
    isDefault: true
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    short: 'HI'
  },
  {
    code: 'te',
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    short: 'TE'
  }
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('real_news_language');
    const valid = SUPPORTED_LANGUAGES.find((l) => l.code === saved);
    return valid ? valid.code : 'en';
  });

  const setLanguage = (newLang) => {
    const valid = SUPPORTED_LANGUAGES.find((l) => l.code === newLang);
    const selected = valid ? valid.code : 'en';
    setLanguageState(selected);
    try {
      localStorage.setItem('real_news_language', selected);
    } catch (e) {
      console.warn('Could not persist language preference:', e);
    }
  };

  const activeLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, activeLanguage, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
