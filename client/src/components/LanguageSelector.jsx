/**
 * LanguageSelector Component
 * 
 * Provides an accessible language selection interface supporting:
 * - Dropdown mode (used in desktop and mobile top navbars)
 * - Segmented button group mode (used in the mobile navigation drawer)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector({ variant = 'dropdown', onSelect }) {
  const { language, setLanguage, activeLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    setIsOpen(false);
    if (onSelect) onSelect(code);
  };

  // Segmented button group variant (e.g. inside mobile navigation drawer)
  if (variant === 'buttons') {
    return (
      <div className="language-button-group" role="group" aria-label="Select news language">
        {languages.map((l) => {
          const isActive = language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelectLanguage(l.code)}
              className={`btn btn-sm language-tab-btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.4rem 0.5rem', lineHeight: 1.2 }}
            >
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{l.nativeLabel}</span>
              <span style={{ fontSize: '0.68rem', opacity: isActive ? 0.9 : 0.65 }}>{l.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant (e.g. inside navbar)
  return (
    <div className="language-selector-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="language-pill-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`News Language: ${activeLanguage.label} (${activeLanguage.nativeLabel})`}
        aria-label="Select Language"
      >
        <Languages size={15} style={{ color: 'var(--accent-tech)' }} />
        <span className="language-label-full">{activeLanguage.nativeLabel}</span>
        <span className="language-label-short">{activeLanguage.short}</span>
        <ChevronDown 
          size={12} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'none', 
            transition: 'transform 150ms ease' 
          }} 
        />
      </button>

      {isOpen && (
        <div className="dropdown-menu language-dropdown-menu" style={{ right: 0, minWidth: '180px' }}>
          <div style={{ padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.25rem' }}>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
              Content Language
            </p>
          </div>

          {languages.map((l) => {
            const isActive = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelectLanguage(l.code)}
                className={`dropdown-item ${isActive ? 'active' : ''}`}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.9rem' }}>
                    {l.nativeLabel}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {l.label}
                  </span>
                </div>

                {isActive && (
                  <Check size={15} style={{ color: 'var(--accent-tech)' }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
