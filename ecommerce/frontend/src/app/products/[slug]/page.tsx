import ProductDetailClient from './ProductDetailClient';
import Link from 'next/link';

async function fetchProductData(slug: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch product SSR:', error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = await fetchProductData(resolvedParams.slug);
  
  if (!product) {
    return { title: 'Product Not Found - HARA' };
  }

  const mainImage = product.images?.find((img: any) => img.is_main) || product.images?.[0];

  return {
    title: `${product.name} - HARA Ceylon`,
    description: product.short_description || product.description,
    openGraph: {
      images: mainImage ? [mainImage.image_url] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const product = await fetchProductData(resolvedParams.slug);

  if (!product) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center pt-20">
        <div className="text-center bg-white p-12 rounded-[2rem] shadow-sm max-w-lg border border-gray-100">
          <h2 className="text-2xl font-serif text-brand-dark mb-4">Product Not Found</h2>
          <p className="text-gray-500 mb-8 font-light">The product you're looking for doesn't exist or has been removed.</p>
          <Link href="/products" className="inline-flex px-8 py-3 bg-brand-dark text-white rounded-full font-medium hover:bg-brand-gold transition-colors">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  const allImages = product.images || [];

  return <ProductDetailClient product={product} allImages={allImages} />;
}
