/**
 * SectionRail Component
 * 
 * Organizes stories into clearly labeled horizontal category rails
 * with an editorial serif title, "See all [Category] →" link, and 3-4 cards.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import NewsCard from './NewsCard';

export default function SectionRail({ title, categoryPath, icon: Icon, articles = [] }) {
  if (!articles || articles.length === 0) return null;

  // Show 4 articles per rail
  const railArticles = articles.slice(0, 4);

  return (
    <section className="section-rail" aria-labelledby={`rail-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="section-rail-header">
        <h2 id={`rail-${title.toLowerCase().replace(/\s+/g, '-')}`} className="section-rail-title">
          {Icon && <Icon size={20} style={{ color: 'var(--brand-red)' }} />}
          <span>{title}</span>
        </h2>

        <Link to={categoryPath} className="section-rail-link">
          <span>See all {title}</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="section-rail-grid">
        {railArticles.map((article, idx) => (
          <NewsCard key={`${article.url || idx}-${idx}-rail`} article={article} />
        ))}
      </div>
    </section>
  );
}
