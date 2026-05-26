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

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();
  return <HomeClient initialProducts={featuredProducts} />;
}
