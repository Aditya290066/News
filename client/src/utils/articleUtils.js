/**
 * Article Utilities
 * 
 * Provides deterministic ID generation, relative time formatting,
 * and editorial category naming.
 */

/**
 * Generates a URL-safe, deterministic identifier for an article based on its canonical URL
 * @param {Object|string} articleOrUrl
 * @returns {string}
 */
export function getArticleId(articleOrUrl) {
  const url = typeof articleOrUrl === 'string' ? articleOrUrl : (articleOrUrl?.url || articleOrUrl?.title || '');
  if (!url) return 'story';

  try {
    // URL-safe base64 encoding without padding
    const encoded = btoa(encodeURIComponent(url))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return encoded;
  } catch (e) {
    // Simple fallback hash
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = (hash << 5) - hash + url.charCodeAt(i);
      hash |= 0;
    }
    return `art-${Math.abs(hash).toString(36)}`;
  }
}

/**
 * Decodes the original canonical URL from a deterministic article ID
 * @param {string} id
 * @returns {string|null}
 */
export function decodeArticleId(id) {
  if (!id) return null;
  try {
    let base64 = id.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return decodeURIComponent(atob(base64));
  } catch (e) {
    return null;
  }
}

/**
 * Formats a timestamp into human-readable editorial relative time ("2 hours ago", "15m ago")
 * @param {string|Date} dateString
 * @param {boolean} verbose - if true, returns "2 hours ago" instead of "2h ago"
 * @returns {string}
 */
export function formatTimeAgo(dateString, verbose = false) {
  if (!dateString) return 'Recently';
  const published = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - published) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 60) return 'Just now';
  
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return verbose ? `${mins} minute${mins > 1 ? 's' : ''} ago` : `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return verbose ? `${hours} hour${hours > 1 ? 's' : ''} ago` : `${hours}h ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return verbose ? `${days} day${days > 1 ? 's' : ''} ago` : `${days}d ago`;
  }
  
  return published.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats category code to clean editorial display title
 * @param {string} rawCat
 * @returns {string}
 */
export function getDisplayCategory(rawCat = '') {
  const cat = (rawCat || '').toLowerCase().trim();
  if (cat === 'general' || cat === 'world') return 'World';
  if (cat.includes('tech')) return 'Technology';
  if (cat.includes('sport')) return 'Sports';
  if (cat.includes('busin')) return 'Business';
  if (cat.includes('sci')) return 'Science';
  if (cat.includes('health')) return 'Health';
  if (cat.includes('entertain')) return 'Entertainment';
  return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'News';
}
