/**
 * Country / Regional Edition Context
 * 
 * Manages the active country edition across the application.
 * Defaults to India ('in') as the primary news edition,
 * with secondary optional choices (US, UK, Australia) accessible via a subtle menu.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export const SUPPORTED_COUNTRIES = [
  { code: 'in', label: 'India', flag: '🇮🇳', isDefault: true },
  { code: 'us', label: 'United States', flag: '🇺🇸' },
  { code: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'au', label: 'Australia', flag: '🇦🇺' }
];

const CountryContext = createContext(null);

export function CountryProvider({ children }) {
  const [country, setCountryState] = useState(() => {
    return localStorage.getItem('real_news_country') || 'in';
  });

  const setCountry = (newCountry) => {
    const valid = SUPPORTED_COUNTRIES.find((c) => c.code === newCountry);
    const selected = valid ? valid.code : 'in';
    setCountryState(selected);
    localStorage.setItem('real_news_country', selected);
  };

  const activeCountry = SUPPORTED_COUNTRIES.find((c) => c.code === country) || SUPPORTED_COUNTRIES[0];

  return (
    <CountryContext.Provider value={{ country, setCountry, activeCountry, countries: SUPPORTED_COUNTRIES }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
