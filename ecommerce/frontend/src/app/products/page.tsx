import ProductsClient from './ProductsClient';

async function fetchProductsData(searchQuery: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
  
  try {
    const url = new URL(`${API_URL}/products`);
    if (searchQuery) url.searchParams.append('search', searchQuery);

    const [productsRes, categoriesRes] = await Promise.all([
      fetch(url.toString(), { next: { revalidate: 30 } }),
      fetch(`${API_URL}/products/categories`, { next: { revalidate: 30 } })
    ]);

    const productsData = productsRes.ok ? await productsRes.json() : { results: [] };
    const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { results: [] };

    return {
      products: productsData.results || productsData || [],
      categories: categoriesData.results || categoriesData || [],
    };
  } catch (error) {
    console.error('Failed to fetch products SSR:', error);
    return { products: [], categories: [] };
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params?.search || '';
  const { products, categories } = await fetchProductsData(searchQuery);

  return (
    <ProductsClient 
      initialProducts={products} 
      categories={categories} 
      searchQuery={searchQuery} 
    />
  );
}
