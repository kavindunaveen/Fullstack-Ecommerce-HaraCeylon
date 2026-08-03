'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cartApi, productsApi, accountApi } from '@/lib/api';
import { ShoppingBag, Heart, ChevronRight, ShieldCheck, Truck, CheckCircle2, Star, Minus, Plus, UserCircle } from 'lucide-react';
import { useCartStore, useWishlistStore, useCurrencyStore, useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
  reviews?: { id: string; rating: number; comment: string; user_name: string; created_at: string }[];
}

export default function ProductDetailClient({ product, allImages }: { product: Product; allImages: any[] }) {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [adding, setAdding] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState(product.reviews || []);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const router = useRouter();

  const { setCart, optimisticAdd, revertCart } = useCartStore();
  const { hasItem, addItem: addWishlist, removeItem: removeWishlist } = useWishlistStore();
  const { formatPrice } = useCurrencyStore();
  const { user, isAuthenticated } = useAuthStore();

  const isWishlisted = hasItem(product.id);
  const inStock = product.stock_quantity > 0;

  useEffect(() => {
    if (allImages.length > 0) {
      const mainImg = allImages.find((img) => img.is_main) || allImages[0];
      setActiveImage(mainImg.image_url);
    }
  }, [allImages]);

  const handleAddToCart = async () => {
    if (adding) return;
    setAdding(true);
    // ⚡ Instantly open cart, update count and subtotal — no network wait
    const previousCart = optimisticAdd(product as any, quantity);
    toast.success('Added to bag');
    try {
      const res = await cartApi.add({ product_id: product.id, quantity });
      setCart(res.data); // Replace with confirmed server data
    } catch {
      revertCart(previousCart); // Rollback on failure
      toast.error('Could not add to bag');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (adding) return;
    setAdding(true);
    try {
      const res = await cartApi.add({ product_id: product.id, quantity });
      setCart(res.data);
      router.push('/checkout');
    } catch {
      toast.error('Could not add to bag');
      setAdding(false);
    }
  };

  const toggleWishlist = async () => {
    if (isWishlisted) {
      removeWishlist(product.id);
      if (isAuthenticated) {
        try { await accountApi.removeWishlist(product.id); } catch (e) { console.error(e); }
      }
      toast.success('Removed from wishlist');
    } else {
      addWishlist(product.id);
      if (isAuthenticated) {
        try { await accountApi.addWishlist({ product_id: product.id }); } catch (e) { console.error(e); }
      }
      toast.success('Added to wishlist');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to leave a review.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await productsApi.addReview(product.slug, {
        rating: reviewRating,
        comment: reviewComment
      });
      setReviews([res.data, ...reviews]);
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';

  return (
    <>
      {/* ── Page wrapper — extra bottom space for sticky bar on mobile ── */}
      <div className="bg-gray-50 min-h-screen pt-16 md:pt-28 pb-36 md:pb-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-5 md:mb-8">
            <Link href="/" className="hover:text-brand-gold transition-colors">Home</Link>
            <ChevronRight size={11} />
            <Link href="/products" className="hover:text-brand-gold transition-colors">Shop</Link>
            <ChevronRight size={11} />
            <span className="text-gray-600 max-w-[140px] truncate">{product.category?.name}</span>
          </nav>

          {/* ── Main Product Card ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100/80 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">

              {/* Image Gallery */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 lg:p-10">
                {/* Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  {product.discount_percentage > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-wide shadow-lg">
                      -{product.discount_percentage}% OFF
                    </span>
                  )}
                  {inStock && product.stock_quantity < 10 && (
                    <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-wide shadow-lg">
                      LOW STOCK
                    </span>
                  )}
                </div>

                {/* Wishlist on image */}
                <button
                  onClick={toggleWishlist}
                  aria-label="Toggle wishlist"
                  className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                    isWishlisted
                      ? 'bg-red-500 text-white shadow-red-200'
                      : 'bg-white text-gray-400 hover:text-red-400'
                  }`}
                >
                  <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>

                {/* Main Image */}
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0.6, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="aspect-square rounded-2xl overflow-hidden bg-white flex items-center justify-center p-6 md:p-10 shadow-sm mb-3"
                >
                  {activeImage ? (
                    <Image
                      src={activeImage}
                      alt={product.name}
                      width={600}
                      height={600}
                      className="w-full h-full object-contain"
                      priority
                    />
                  ) : (
                    <div className="text-gray-300 text-sm">No Image</div>
                  )}
                </motion.div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto hide-scrollbar">
                    {allImages.map((img: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(img.image_url)}
                        aria-label={`View image ${idx + 1}`}
                        className={`shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white border-2 overflow-hidden transition-all duration-200 ${
                          activeImage === img.image_url
                            ? 'border-brand-gold shadow-md shadow-brand-gold/20 scale-105'
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <Image src={img.image_url} alt="" width={64} height={64} className="w-full h-full object-contain p-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5 md:p-8 lg:p-10 flex flex-col">

                {/* Category & Title */}
                <div className="mb-4">
                  <span className="inline-block bg-brand-gold/10 text-brand-gold text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                    {product.category?.name}
                  </span>
                  <h1 className="text-2xl md:text-4xl font-serif text-gray-900 leading-tight font-bold">
                    {product.name}
                  </h1>
                  <p className="text-[11px] text-gray-400 font-mono mt-1">SKU: {product.sku}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1,2,3,4,5].map(i => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={i <= Math.round(Number(avgRating)) ? "text-brand-gold fill-brand-gold" : "text-gray-200"} 
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {avgRating} ({reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-5 pb-5 border-b border-gray-100">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                    {formatPrice(Number(product.effective_price))}
                  </span>
                  {product.discount_percentage > 0 && (
                    <span className="text-lg text-gray-400 line-through font-normal">
                      {formatPrice(Number(product.price))}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-6 font-light">
                  {product.description || product.short_description || 'Experience the authentic taste of premium Ceylon goodness. Sourced directly from ethical estates in Sri Lanka.'}
                </p>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-gray-50 rounded-2xl">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${inStock ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                      <CheckCircle2 size={15} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 leading-tight">{inStock ? `In Stock` : 'Out of Stock'}</span>
                    {inStock && <span className="text-[9px] text-gray-400">{product.stock_quantity} left</span>}
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Truck size={15} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 leading-tight">Global Delivery</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-8 h-8 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                      <ShieldCheck size={15} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 leading-tight">100% Authentic</span>
                  </div>
                </div>

                {/* Desktop quantity + actions */}
                <div className="hidden md:flex flex-col gap-4 mt-auto">
                  <div className="flex items-center gap-4">
                    {/* Quantity */}
                    <div className="flex items-center bg-gray-100 rounded-2xl h-14 px-2 gap-1 w-36 shrink-0">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={!inStock}
                        aria-label="Decrease quantity"
                        className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-brand-dark transition-colors font-bold disabled:opacity-40"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="flex-1 text-center font-bold text-gray-900 text-lg">{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => q + 1)}
                        disabled={!inStock || quantity >= product.stock_quantity}
                        aria-label="Increase quantity"
                        className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-brand-dark transition-colors font-bold disabled:opacity-40"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {/* Add to Bag */}
                    <button
                      onClick={handleAddToCart}
                      disabled={!inStock || adding}
                      className="flex-1 h-14 bg-brand-dark hover:bg-brand-gold text-white rounded-2xl font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg shadow-brand-dark/20 disabled:opacity-50"
                    >
                      <ShoppingBag size={18} />
                      {!inStock ? 'Out of Stock' : adding ? 'Adding…' : 'Add to Bag'}
                    </button>
                  </div>
                  {/* Buy Now */}
                  <button
                    onClick={handleBuyNow}
                    disabled={!inStock || adding}
                    className="w-full h-14 bg-brand-gold hover:bg-brand-dark text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300 shadow-lg shadow-brand-gold/20 disabled:opacity-50"
                  >
                    Buy Now — {formatPrice(Number(product.effective_price) * quantity)}
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* ── Reviews Section ── */}
          <div className="mt-16 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">Customer Reviews</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-2xl p-6 text-center mb-8">
                  <span className="text-5xl font-bold text-brand-dark">{avgRating}</span>
                  <div className="flex justify-center mt-2 mb-2">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={16} className={i <= Math.round(Number(avgRating)) ? "text-brand-gold fill-brand-gold" : "text-gray-200"} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">Based on {reviews.length} reviews</span>
                </div>

                {/* Review Form */}
                {user ? (
                  <form onSubmit={handleReviewSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4">Write a Review</h3>
                    <div className="mb-4 flex gap-1 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star 
                            size={24} 
                            className={star <= reviewRating ? "text-brand-gold fill-brand-gold" : "text-gray-200"} 
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience..."
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all"
                      rows={4}
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full bg-brand-dark text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-gold transition-colors disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                ) : (
                  <div className="bg-brand-gold/10 rounded-2xl p-6 text-center border border-brand-gold/20">
                    <p className="text-brand-dark text-sm mb-4">Please log in to leave a review.</p>
                    <Link href="/account/login" className="inline-block bg-brand-dark text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-brand-gold transition-colors">
                      Log In
                    </Link>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No reviews yet. Be the first to review this product!</div>
                ) : (
                  reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <UserCircle size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{review.user_name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  size={10} 
                                  className={star <= review.rating ? "text-brand-gold fill-brand-gold" : "text-gray-200"} 
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[95] bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
        
        {/* Product mini info strip */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-gray-400 truncate max-w-[160px]">{product.name}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Qty controls */}
            <div className="flex items-center gap-0 bg-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={!inStock}
                aria-label="Decrease quantity"
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors font-bold disabled:opacity-40"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-bold text-sm text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                disabled={!inStock || quantity >= product.stock_quantity}
                aria-label="Increase quantity"
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors font-bold disabled:opacity-40"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="font-bold text-base text-gray-900">
              {formatPrice(Number(product.effective_price) * quantity)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Wishlist */}
          <button
            onClick={toggleWishlist}
            aria-label="Toggle wishlist"
            className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all ${
              isWishlisted
                ? 'bg-red-50 border-red-200 text-red-500'
                : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
          >
            <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Add to Bag */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock || adding}
            className="flex-1 h-12 bg-brand-dark text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
          >
            <ShoppingBag size={16} />
            {!inStock ? 'Out of Stock' : adding ? 'Adding…' : 'Add to Bag'}
          </button>

          {/* Buy Now */}
          <button
            onClick={handleBuyNow}
            disabled={!inStock || adding}
            className="flex-1 h-12 bg-brand-gold text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50 active:scale-95"
          >
            Buy Now
          </button>
        </div>
      </div>
    </>
  );
}
