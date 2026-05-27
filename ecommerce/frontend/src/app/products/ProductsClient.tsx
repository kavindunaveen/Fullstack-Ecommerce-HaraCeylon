'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cartApi } from '@/lib/api';
import { ShoppingBag, Filter, SlidersHorizontal } from 'lucide-react';
import { useCartStore, useCurrencyStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { motion, Variants, AnimatePresence } from 'framer-motion';

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

interface ProductsClientProps {
  initialProducts: Product[];
  categories: Category[];
  searchQuery: string;
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const itemAnim: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function ProductsClient({ initialProducts, categories, searchQuery }: ProductsClientProps) {
  const [filter, setFilter] = useState('all');
  const [addingId, setAddingId] = useState<string | null>(null);

  const { setCart, optimisticAdd, revertCart, openCart } = useCartStore();
  const { formatPrice } = useCurrencyStore();

  const filteredProducts = initialProducts.filter(p => {
    if (filter === 'all') return true;
    return p.category_name?.toLowerCase() === filter.toLowerCase();
  });

  const addToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (addingId === product.id) return;
    setAddingId(product.id);
    openCart();
    // ⚡ Instantly open cart and update counts — no waiting for network
    const previousCart = optimisticAdd(product as any, 1);
    toast.success('Added to bag');
    try {
      const res = await cartApi.add({ product_id: product.id, quantity: 1 });
      setCart(res.data);
    } catch {
      revertCart(previousCart);
      toast.error('Could not add to bag');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="bg-brand-light min-h-screen pb-20 md:pb-0">
      {/* Page Header */}
      <header className="relative pt-24 pb-12 md:pt-32 md:pb-20 px-4 md:px-6 overflow-hidden bg-brand-dark">
        <div className="absolute inset-0 w-full h-full opacity-25">
          <img src="/hero-bg.webp" alt="" className="w-full h-full object-cover mix-blend-overlay" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto text-center mt-6 md:mt-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="block text-brand-gold font-bold tracking-[0.3em] uppercase mb-3 text-[10px] md:text-xs"
          >
            Official Store
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-4 md:mb-6"
          >
            Our Full Collection
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-lg text-gray-300 font-light max-w-2xl mx-auto"
          >
            Discover premium teas and coffees harvested from the highlands of Sri Lanka.
          </motion.p>
        </div>
      </header>

      <section className="py-8 md:py-20">
        <div className="container max-w-7xl mx-auto px-3 md:px-6">

          {/* Filter bar */}
          {searchQuery ? (
            <div className="text-center mb-8 md:mb-16">
              <h2 className="text-xl md:text-2xl font-serif text-gray-800">
                Search results for: &ldquo;{searchQuery}&rdquo;
              </h2>
              <p className="text-sm text-gray-400 mt-1">{filteredProducts.length} products found</p>
            </div>
          ) : (
            <div className="mb-8 md:mb-16">
              <div className="flex items-center gap-2 mb-3 md:hidden px-1">
                <SlidersHorizontal size={14} className="text-brand-gold" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter by category</span>
              </div>
              {/* Scrollable pill bar — mobile-friendly */}
              <div className="flex gap-2 overflow-x-auto scroll-smooth-touch hide-scrollbar pb-2 md:justify-center">
                <button
                  onClick={() => setFilter('all')}
                  className={`shrink-0 px-4 py-2.5 md:px-8 md:py-3 rounded-full font-semibold text-xs md:text-sm transition-all duration-300 uppercase tracking-wider whitespace-nowrap ${
                    filter === 'all'
                      ? 'bg-brand-dark text-white shadow-md'
                      : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setFilter(cat.name.toLowerCase())}
                    className={`shrink-0 px-4 py-2.5 md:px-8 md:py-3 rounded-full font-semibold text-xs md:text-sm transition-all duration-300 uppercase tracking-wider whitespace-nowrap ${
                      filter === cat.name.toLowerCase()
                        ? 'bg-brand-dark text-white shadow-md'
                        : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8"
            >
              {filteredProducts.map((product) => (
                <motion.div variants={itemAnim} key={product.id} className="group cursor-pointer">
                  {/* Card */}
                  <div className="relative bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1 md:group-hover:-translate-y-2 mb-2.5 md:mb-6">
                    <Link href={`/products/${product.slug}`} className="block aspect-[4/5]">
                      {product.main_image ? (
                        <Image
                          src={product.main_image.image_url}
                          alt={product.name}
                          width={400}
                          height={500}
                          className="w-full h-full object-contain p-4 md:p-8 transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
                      )}

                      {/* Badge */}
                      <div className="absolute top-2.5 left-2.5 md:top-4 md:left-4 z-10 flex flex-col gap-1.5">
                        <span className="bg-white/90 backdrop-blur text-brand-dark px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-bold tracking-wider uppercase shadow-sm">
                          {product.category_name}
                        </span>
                      </div>

                      {/* Desktop hover button */}
                      <div className="absolute bottom-3 left-3 right-3 z-20 translate-y-14 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
                        <button
                          onClick={(e) => addToCart(e, product)}
                          disabled={addingId === product.id}
                          className="w-full bg-brand-dark text-white py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-brand-gold transition-colors shadow-lg disabled:opacity-60"
                        >
                          <ShoppingBag size={15} />
                          {addingId === product.id ? 'Adding…' : 'Add to Bag'}
                        </button>
                      </div>
                    </Link>

                    {/* Mobile always-visible add to cart */}
                    <div className="md:hidden border-t border-gray-100">
                      <button
                        onClick={(e) => addToCart(e, product)}
                        disabled={addingId === product.id}
                        className="w-full py-2.5 bg-brand-dark text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-brand-gold transition-colors disabled:opacity-60"
                      >
                        <ShoppingBag size={13} />
                        {addingId === product.id ? 'Adding…' : 'Add to Bag'}
                      </button>
                    </div>
                  </div>

                  {/* Product info */}
                  <div className="px-0.5">
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-serif text-sm md:text-lg text-gray-900 group-hover:text-brand-green transition-colors line-clamp-2 leading-snug"
                    >
                      {product.name}
                    </Link>
                    <p className="text-gray-600 mt-0.5 font-semibold text-sm md:text-base">
                      {formatPrice(Number(product.effective_price))}
                    </p>
                  </div>
                </motion.div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 md:py-32 text-center">
                  <div className="inline-block p-8 md:p-12 rounded-[2rem] bg-white border border-gray-100 shadow-sm max-w-sm mx-auto">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-brand-gold">
                      <Filter size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-serif text-brand-dark mb-2 md:mb-3">Brewing Soon</h3>
                    <p className="text-gray-500 text-sm leading-relaxed font-light">
                      Our premium collection is currently being curated. Check back soon for new arrivals.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
