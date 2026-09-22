/**
 * Client-Side Curated Editorial News Fallback
 * 
 * Guarantees that ANEWS always renders a rich, premium editorial layout
 * even if the network is disrupted or third-party news wires are rate-limited.
 */

export const FALLBACK_ARTICLES = [
  {
    id: "fb_tech_1",
    title: "Global AI Computing Clusters Shift Towards Next-Gen High-Density Silicon",
    description: "Leading semiconductor designers and cloud infrastructure architects unveil high-efficiency architecture breakthroughs designed to slash data center power consumption while doubling inference throughput.",
    url: "https://technewsworld.com/story/next-gen-ai-clusters",
    imageUrl: "/assets/editorial/tech_1.jpg",
    sourceName: "Tech Wire Global",
    category: "technology",
    publishedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    provider: "ANEWS Editorial"
  },
  {
    id: "fb_sports_1",
    title: "India Cricket & International Athletics: Squad Rotations and Tactical Shifts",
    description: "Strategic masterclasses, top-order dynamics, and bowling selections headline preparations ahead of upcoming international fixtures, with analysts reviewing team balance and fitness metrics.",
    url: "https://espncricinfo.com/story/champions-trophy-tactics",
    imageUrl: "/assets/editorial/sports_1.jpg",
    sourceName: "Sports Central",
    category: "sports",
    publishedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    provider: "ANEWS Editorial"
  },
  {
    id: "fb_business_1",
    title: "Sensex & Global Markets Rally as Inflation Figures Stabilize Across Key Sectors",
    description: "Equities recorded broad-based gains supported by banking, technology, and manufacturing stocks following constructive macroeconomic forecasts by central banks.",
    url: "https://bloomberg.com/news/articles/global-markets-inflation-update",
    imageUrl: "/assets/editorial/business_1.jpg",
    sourceName: "Financial Dispatch",
    category: "business",
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    provider: "ANEWS Editorial"
  },
  {
    id: "fb_world_1",
    title: "International Renewable Grid Coalition Concludes Historic Clean Energy Accord",
    description: "Delegates across thirty nations finalize standardized cross-continental green power grid transmission protocols, accelerating offshore wind and solar integration.",
    url: "https://reuters.com/business/energy/international-grid-clean-power-accord",
    imageUrl: "/assets/editorial/world_1.jpg",
    sourceName: "World Affairs Wire",
    category: "world",
    publishedAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    provider: "ANEWS Editorial"
  },
  {
    id: "fb_science_1",
    title: "Quantum Sensing Achieves New Precision Benchmarks in Geophysical Surveys",
    description: "Researchers deploy room-temperature diamond nitrogen-vacancy quantum sensors to map subterranean aquifers and mineral formations with millimeter-level accuracy.",
    url: "https://sciencedaily.com/releases/quantum-sensing-advances",
    imageUrl: "/assets/editorial/science_1.jpg",
    sourceName: "Science Horizon",
    category: "science",
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    provider: "ANEWS Editorial"
  },
  {
    id: "fb_health_1",
    title: "Wearable Health Monitors Advance Preventive Cardiology with Multi-Sensor Analytics",
    description: "New clinical trials demonstrate that continuous micro-vascular monitoring via consumer smart wearables can forecast arrhythmia risks weeks prior to acute symptom onset.",
    url: "https://medicalnewstoday.com/articles/wearable-cardio-monitoring",
    imageUrl: "/assets/editorial/health_1.jpg",
    sourceName: "Health Science Journal",
    category: "health",
    publishedAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    provider: "ANEWS Editorial"
  },
  {
    id: "fb_tech_2",
    title: "Next-Gen Web Frameworks Pioneer Zero-Runtime CSS and Native React Concurrency",
    description: "Frontend performance engineering sees significant upgrades with declarative hydration, incremental streaming, and sub-second cold starts.",
    url: "https://dev.to/frontend/next-gen-web-compilers",
    imageUrl: "/assets/editorial/tech_2.jpg",
    sourceName: "Frontend Chronicle",
    category: "technology",
    publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    provider: "ANEWS Editorial"
  },
  {
    id: "fb_sports_2",
    title: "Major League Tennis & Athletics: Rising Stars Redefine Tour Championship Dynamics",
    description: "Intense five-set thrillers and record sprint splits set the stage for one of the most competitive grand slam seasons in recent history.",
    url: "https://theathletic.com/tennis/tour-championship-rise",
    imageUrl: "/assets/editorial/sports_2.jpg",
    sourceName: "Global Stadium",
    category: "sports",
    publishedAt: new Date(Date.now() - 1000 * 60 * 270).toISOString(),
    provider: "ANEWS Editorial"
  }
];

export function getClientFallbackArticles(category = 'all', count = 12) {
  const cat = (category || 'all').toLowerCase().trim();
  let filtered = FALLBACK_ARTICLES;

  if (cat !== 'all' && cat !== 'general') {
    filtered = FALLBACK_ARTICLES.filter(a => a.category === cat);
    if (filtered.length === 0) {
      filtered = FALLBACK_ARTICLES;
    }
  }

  return filtered.slice(0, count);
}
