'use client';
import { useEffect, useState } from 'react';
import { useWishlistStore, useCartStore, useCurrencyStore } from '@/lib/store';
import { productsApi, cartApi } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag, Trash2, ArrowRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function WishlistPage() {
  const wishlistIds = useWishlistStore(state => state.items);
  const removeWishlist = useWishlistStore(state => state.removeItem);
  const { setCart, openCart } = useCartStore();
  const { formatPrice } = useCurrencyStore();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    console.log('Wishlist IDs updated:', wishlistIds);
    // Normalize IDs (in case of legacy objects or formatting issues)
    const normalizedIds = wishlistIds.map((i: any) => 
      String(typeof i === 'string' ? i : (i.product_id || i.id)).trim().toLowerCase()
    );

    if (normalizedIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    productsApi.list({ ids: normalizedIds.join(',') }).then((res) => {
      const data = res.data.results || res.data || [];
      console.log('Fetched wishlist products:', data.length);
      setProducts(data);
    }).catch(() => toast.error('Failed to load wishlist products'))
      .finally(() => setLoading(false));
  }, [wishlistIds, mounted]);

  const addToCart = async (product: any) => {
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

  if (!mounted) return null;

  return (
    <div className="pt-[100px] bg-[#fdfdfd] min-h-screen pb-24">
      {/* Header */}
      <div className="bg-brand-dark text-white py-16 mb-[-48px]">
        <div className="container max-w-5xl mx-auto px-6">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-brand-gold hover:text-white transition-colors mb-4">
            ← Back to Account
          </Link>
          <h1 className="text-4xl font-serif font-bold tracking-tight">My <span className="text-brand-gold">Wishlist</span></h1>
          <p className="text-gray-400 mt-2 font-light">Your curated collection of premium favorites.</p>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/[0.03] border border-gray-50 p-8 md:p-12 min-h-[400px]">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-gray-400">Curating your favorites...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-200">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-serif font-bold text-brand-dark mb-3">Your wishlist is empty</h3>
              <p className="text-gray-500 mb-8 max-w-xs mx-auto">Explore our collection and save your favorite items for later.</p>
              <Link href="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-dark text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-brand-gold transition-all shadow-xl shadow-brand-dark/10">
                Start Shopping <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {products.map((product) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={product.id} 
                  className="group relative bg-white border border-gray-100 rounded-[2rem] p-6 hover:border-brand-gold/30 hover:shadow-2xl hover:shadow-brand-dark/5 transition-all duration-500 flex gap-6"
                >
                  <Link href={`/products/${product.slug}`} className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                    {product.main_image ? (
                      <Image src={product.main_image.image_url} alt={product.name} width={96} height={96} className="w-full h-full object-contain" />
                    ) : (
                      <Package size={24} className="text-gray-300" />
                    )}
                  </Link>
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-serif font-bold text-brand-dark hover:text-brand-gold transition-colors line-clamp-1">{product.name}</h3>
                        </Link>
                        <button 
                          onClick={() => {
                            console.log('Removing product ID:', product.id);
                            removeWishlist(product.id);
                            setProducts(prev => prev.filter(p => p.id !== product.id));
                            toast.success('Removed from favorites');
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-sm font-black text-brand-dark mt-1">{formatPrice(Number(product.effective_price))}</p>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        onClick={() => addToCart(product)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold transition-all"
                      >
                        <ShoppingBag size={14} /> Add to Bag
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
