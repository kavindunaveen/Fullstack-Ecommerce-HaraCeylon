'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsApi, cartApi } from '@/lib/api';
import { ShoppingBag, Heart, ArrowRight, CheckCircle2, ChevronRight, Share2, ShieldCheck, Truck } from 'lucide-react';
import { useCartStore, useWishlistStore } from '@/lib/store';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCurrencyStore } from '@/lib/store';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category?: { name: string; slug: string };
  description: string;
  short_description: string;
  price: string | number;
  sale_price: string | number | null;
  effective_price: string | number;
  discount_percentage: number;
  stock_quantity: number;
  stock_status: string;
  images: { image_url: string; alt_text: string; is_main: boolean }[];
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const router = useRouter();

  const { setCart, openCart } = useCartStore();
  const { items: wishlistItems, addItem: addWishlist, removeItem: removeWishlist } = useWishlistStore();
  const { formatPrice } = useCurrencyStore();

  const isWishlisted = wishlistItems.some((item: any) => (item.product_id || item) === product?.id);

  useEffect(() => {
    productsApi.detail(slug as string).then((res) => {
      const data = res.data;
      setProduct(data);
      // ProductDetailSerializer returns images[] — find is_main or fall back to first
      const images: { image_url: string; alt_text: string; is_main: boolean }[] = data.images || [];
      const mainImg = images.find((img) => img.is_main) || images[0];
      if (mainImg) setActiveImage(mainImg.image_url);
      setLoading(false);
    }).catch(() => {
      toast.error('Product not found');
      setLoading(false);
    });
  }, [slug]);

  const handleAddToCart = async () => {
    try {
      const res = await cartApi.add({ product_id: product.id, quantity });
      setCart(res.data);
      toast.success('Added to bag');
      openCart();
    } catch {
      toast.error('Could not add to bag');
    }
  };

  const toggleWishlist = () => {
    if (isWishlisted) {
      removeWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addWishlist(product.id);
      toast.success('Added to wishlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center pt-20">
        <div className="spinner"></div>
      </div>
    );
  }

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

  // ProductDetailSerializer returns images[] (all product images with is_main flag)
  const allImages: { image_url: string; alt_text: string; is_main: boolean }[] = product.images || [];

  return (
    <div className="bg-brand-light min-h-screen pt-32 pb-24">
      <div className="container max-w-7xl mx-auto px-6">
        
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest mb-10">
          <Link href="/" className="hover:text-brand-gold transition-colors">Home</Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link href="/products" className="hover:text-brand-gold transition-colors">Shop</Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-brand-dark">{product.category?.name}</span>
        </nav>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* Image Gallery */}
            <div className="p-8 lg:p-12 lg:border-r border-gray-100 bg-gray-50/50 flex flex-col">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ duration: 0.5 }}
                className="relative aspect-square bg-white rounded-3xl overflow-hidden mb-6 flex-1 shadow-sm border border-gray-100 flex items-center justify-center p-8"
              >
                {activeImage ? (
                  <img src={activeImage} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-gray-400">No Image</div>
                )}
                
                {product.stock_quantity > 0 && product.stock_quantity < 10 && (
                  <div className="absolute top-6 left-6 bg-red-500 text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-md">
                    Low Stock
                  </div>
                )}
              </motion.div>

              {allImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                  {allImages.map((img: any, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveImage(img.image_url)}
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all duration-300 bg-white ${activeImage === img.image_url ? 'border-brand-gold shadow-md' : 'border-transparent hover:border-gray-300'}`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-contain p-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-8 lg:p-16 flex flex-col">
              <div className="flex justify-between items-start mb-4 gap-4">
                <div>
                  <span className="text-brand-gold font-bold tracking-[0.2em] uppercase text-xs mb-2 block">{product.category?.name}</span>
                  <h1 className="text-3xl md:text-5xl font-serif text-brand-dark leading-tight">{product.name}</h1>
                </div>
                <button 
                  onClick={toggleWishlist}
                  className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center border transition-all duration-300 ${isWishlisted ? 'bg-red-50 border-red-100 text-red-500 shadow-inner' : 'bg-white border-gray-200 text-gray-400 hover:border-brand-gold hover:text-brand-gold shadow-sm'}`}
                >
                  <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="flex items-end gap-4 mb-8">
                <span className="text-3xl font-medium text-gray-900">{formatPrice(Number(product.effective_price))}</span>
                {product.discount_percentage > 0 && (
                  <span className="text-lg text-gray-400 line-through mb-1">{formatPrice(Number(product.price))}</span>
                )}
              </div>

              <div className="prose prose-sm text-gray-500 font-light leading-relaxed mb-10">
                <p>{product.description || product.short_description || 'Experience the authentic taste of premium Ceylon goodness. Sourced directly from ethical estates in Sri Lanka.'}</p>
              </div>

              {/* Actions */}
              <div className="mt-auto">
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl h-14 w-full sm:w-32 px-2 shrink-0 shadow-sm">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-brand-dark hover:bg-white rounded-xl transition-colors"
                      disabled={product.stock_quantity === 0}
                    >-</button>
                    <span className="flex-1 text-center font-medium text-gray-900">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-brand-dark hover:bg-white rounded-xl transition-colors"
                      disabled={product.stock_quantity === 0 || quantity >= product.stock_quantity}
                    >+</button>
                  </div>
                  
                  <button 
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0}
                    className="flex-1 btn-modern bg-brand-dark text-white rounded-2xl h-14 font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-gold transition-colors shadow-xl shadow-brand-dark/10"
                  >
                    <ShoppingBag size={18} />
                    {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Bag'}
                  </button>
                  <button 
                    onClick={async () => {
                      await handleAddToCart();
                      router.push('/checkout');
                    }}
                    disabled={product.stock_quantity === 0}
                    className="flex-1 btn-modern bg-brand-gold text-white rounded-2xl h-14 font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-dark transition-colors shadow-xl shadow-brand-gold/20"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${product.stock_quantity > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="font-medium">
                      {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Truck size={16} /></div>
                    <span className="font-medium">Global Delivery</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center"><ShieldCheck size={16} /></div>
                    <span className="font-medium">100% Authentic</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 cursor-pointer transition-colors"><Share2 size={16} /></div>
                    <span className="font-medium">Share Product</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
