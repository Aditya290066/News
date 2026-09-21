/**
 * Editorial Image Utilities
 * 
 * Provides curated, high-resolution editorial banner graphics for articles
 * across all categories (Tech, Sports, Business, Science, Health, Entertainment, World)
 * that lack images from NewsAPI or whose remote image hosts fail/block hotlinking.
 */

/**
 * Returns a high-quality editorial fallback image path based on category and title
 * @param {string} category
 * @param {string} title
 * @returns {string}
 */
export function getEditorialImage(category = '', title = '') {
  const cat = (category || '').toLowerCase();
  
  // Calculate deterministic index from title string for variants
  let hash = 0;
  for (let i = 0; i < (title || '').length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const index = (Math.abs(hash) % 2) + 1; // 1 or 2

  if (cat.includes('sport')) {
    return `/assets/editorial/sports_${index}.jpg`;
  }
  if (cat.includes('business')) {
    return '/assets/editorial/business_1.jpg';
  }
  if (cat.includes('science')) {
    return '/assets/editorial/science_1.jpg';
  }
  if (cat.includes('health')) {
    return '/assets/editorial/health_1.jpg';
  }
  if (cat.includes('entertain')) {
    return '/assets/editorial/entertainment_1.jpg';
  }
  if (cat.includes('world') || cat.includes('general')) {
    return '/assets/editorial/world_1.jpg';
  }
  
  // Default to technology/digital editorial banner
  return `/assets/editorial/tech_${index}.jpg`;
}
