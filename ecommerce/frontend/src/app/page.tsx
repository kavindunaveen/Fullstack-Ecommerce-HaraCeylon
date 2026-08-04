import HomeClient from './HomeClient';

async function getFeaturedProducts() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
    // Use native fetch for SSR with Next.js caching
    const res = await fetch(`${API_URL}/products/featured`, { 
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (!res.ok) {
      console.error('Failed to fetch featured products, status:', res.status);
      return [];
    }
    
    const data = await res.json();
    return data.results || data || [];
  } catch (error) {
    console.error('Error fetching featured products during SSR:', error);
    return [];
  }
}

async function getHeroSlides() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
    const res = await fetch(`${API_URL}/hero-slides`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const [featuredProducts, heroSlides] = await Promise.all([
    getFeaturedProducts(),
    getHeroSlides()
  ]);
  
  return <HomeClient initialProducts={featuredProducts} initialSlides={heroSlides} />;
}
