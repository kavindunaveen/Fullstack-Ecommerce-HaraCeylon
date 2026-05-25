'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { categoriesApi, productsApi, cartApi } from '@/lib/api';
import { ShoppingBag, ArrowRight, Filter } from 'lucide-react';
import { useCartStore, useCurrencyStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';

interface Category {
  slug: string;
  name: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  category_name?: string;
  effective_price: string | number;
  main_image?: { image_url: string };
}

function ShopContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const { setCart, openCart } = useCartStore();
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      setLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productsApi.list(searchQuery ? { search: searchQuery } : {}),
          categoriesApi.list().catch(() => ({ data: [] }))
        ]);
        setProducts(productsRes.data.results || productsRes.data || []);
        setCategories(categoriesRes.data?.results || categoriesRes.data || []);
      } catch (err) {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProductsAndCategories();
  }, [searchQuery]);

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true;
    return p.category_name?.toLowerCase() === filter.toLowerCase();
  });

  const addToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    // Open cart and toast immediately — don't wait for API
    openCart();
    toast.success('Added to bag');
    try {
      const res = await cartApi.add({ product_id: product.id, quantity: 1 });
      setCart(res.data);
    } catch {
      toast.error('Could not add to bag');
    }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemAnim: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="bg-brand-light min-h-screen">
      <header className="relative pt-32 pb-20 px-6 overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 w-full h-full opacity-30">
          <img src="/hero-bg.webp" alt="Background" className="w-full h-full object-cover mix-blend-overlay" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center mt-12">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="block text-brand-gold font-bold tracking-[0.3em] uppercase mb-4 text-xs">Official Store</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-6">Our Full Collection</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-lg text-gray-300 font-light max-w-2xl mx-auto">Discover premium teas and coffees harvested from the highlands of Sri Lanka.</motion.p>
        </div>
      </header>

      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          
          {searchQuery ? (
            <div className="text-center mb-16">
              <h2 className="text-2xl font-serif text-gray-800">Search results for: "{searchQuery}"</h2>
            </div>
          ) : (
            <div className="flex justify-center mb-16">
              <div className="bg-white p-1.5 rounded-full flex items-center gap-1 shadow-sm border border-gray-100 overflow-x-auto whitespace-nowrap">
                <button 
                  onClick={() => setFilter('all')} 
                  className={`px-8 py-3 rounded-full font-medium text-sm transition-all duration-300 uppercase tracking-wider ${filter === 'all' ? 'bg-brand-dark text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button 
                    key={cat.slug}
                    onClick={() => setFilter(cat.name.toLowerCase())} 
                    className={`px-8 py-3 rounded-full font-medium text-sm transition-all duration-300 uppercase tracking-wider ${filter === cat.name.toLowerCase() ? 'bg-brand-dark text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-32">
              <div className="spinner"></div>
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <motion.div variants={itemAnim} key={product.id} className="group cursor-pointer">
                  <Link href={`/products/${product.slug}`} className="block relative bg-white rounded-3xl overflow-hidden aspect-[4/5] mb-6 transition-all duration-500 shadow-sm hover:shadow-xl group-hover:-translate-y-2">
                    <div className="absolute inset-0 bg-gray-50/50 group-hover:bg-transparent transition-colors z-0"></div>
                    {product.main_image ? (
                      <Image
                        src={product.main_image.image_url}
                        alt={product.name}
                        width={400}
                        height={500}
                        className="w-full h-full object-contain p-8 relative z-10 transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 relative z-10">No Image</div>
                    )}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                      <span className="bg-white/90 backdrop-blur text-brand-dark px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm">
                        {product.category_name}
                      </span>
                      <div className="bg-brand-dark/90 backdrop-blur p-1 rounded-lg w-fit shadow-sm border border-white/10">
                        <Image src="/logo.png" alt="Hara" width={64} height={16} className="h-4 w-auto" />
                      </div>
                    </div>
                    
                    {/* Hover Add to Cart */}
                    <div className="absolute bottom-4 left-4 right-4 z-20 translate-y-16 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={(e) => addToCart(e, product)} className="w-full bg-brand-dark text-white py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-brand-gold transition-colors shadow-lg">
                        <ShoppingBag size={16} /> Add to Bag
                      </button>
                    </div>
                  </Link>
                  <div>
                    <Link href={`/products/${product.slug}`} className="font-serif text-lg text-gray-900 group-hover:text-brand-green transition-colors line-clamp-1">
                      {product.name}
                    </Link>
                    <p className="text-gray-500 mt-1 font-medium">{formatPrice(Number(product.effective_price))}</p>
                  </div>
                </motion.div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-32 text-center">
                  <div className="inline-block p-12 rounded-[2rem] bg-white border border-gray-100 shadow-sm max-w-lg">
                    <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6 text-brand-gold">
                      <Filter size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-serif text-brand-dark mb-3">Brewing Soon</h3>
                    <p className="text-gray-500 mb-4 leading-relaxed font-light">
                      Our premium collection is currently being curated. Check back soon for new arrivals.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-[80px] bg-brand-light"><div className="spinner"></div></div>}>
      <ShopContent />
    </Suspense>
  );
}
