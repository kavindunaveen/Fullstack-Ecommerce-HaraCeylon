'use client';
import { useCartStore, useCurrencyStore } from '@/lib/store';
import { cartApi } from '@/lib/api';
import { X, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type { CartItem } from '@/lib/store';

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, setCart } = useCartStore();
  const { formatPrice } = useCurrencyStore();

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity === 0) {
        await cartApi.remove(itemId);
      } else {
        await cartApi.update(itemId, { quantity });
      }
      const res = await cartApi.get();
      setCart(res.data);
    } catch {
      toast.error('Could not update cart');
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await cartApi.remove(itemId);
      const res = await cartApi.get();
      setCart(res.data);
      toast.success('Item removed');
    } catch {
      toast.error('Could not remove item');
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-[200]"
            onClick={closeCart}
          />

          {/* ── Desktop: right-side drawer ── */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="hidden md:flex fixed right-0 top-0 bottom-0 w-[440px] bg-white z-[201] flex-col shadow-2xl"
          >
            <CartContent
              cart={cart}
              formatPrice={formatPrice}
              closeCart={closeCart}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
            />
          </motion.div>

          {/* ── Mobile: bottom sheet ── */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="md:hidden fixed left-0 right-0 bottom-0 bg-white z-[201] flex flex-col shadow-2xl rounded-t-3xl"
            style={{ maxHeight: '90svh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <CartContent
              cart={cart}
              formatPrice={formatPrice}
              closeCart={closeCart}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              isMobile
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* Shared Cart Content Component */
function CartContent({
  cart, formatPrice, closeCart, updateQuantity, removeItem, isMobile = false
}: {
  cart: any;
  formatPrice: (n: number) => string;
  closeCart: () => void;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  isMobile?: boolean;
}) {
  return (
    <>
      {/* Header */}
      <div className={`px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 ${isMobile ? '' : 'p-6'}`}>
        <div className="flex items-center gap-3">
          <ShoppingBag size={19} className="text-brand-dark" strokeWidth={1.5} />
          <h2 className="font-serif text-xl md:text-2xl font-bold text-brand-dark">Your Bag</h2>
          {(cart?.item_count || 0) > 0 && (
            <span className="bg-brand-gold/10 text-brand-gold text-xs font-bold px-2.5 py-0.5 rounded-full">
              {cart?.item_count}
            </span>
          )}
        </div>
        <button
          onClick={closeCart}
          className="p-2 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-full transition-colors touch-target"
          aria-label="Close cart"
        >
          <X size={20} />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto scroll-smooth-touch p-4 md:p-6 bg-gray-50/50">
        {(!cart?.items || cart.items.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center space-y-4 py-12">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
              <ShoppingBag size={28} strokeWidth={1.5} className="text-gray-300" />
            </div>
            <p className="font-light text-base md:text-lg">Your bag is empty.</p>
            <Link href="/products" onClick={closeCart} className="text-brand-gold font-semibold hover:underline text-sm">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {cart.items.map((item: CartItem) => (
              <div key={item.id} className="bg-white p-3.5 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3.5">
                {/* Image */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gray-50 border border-gray-100 shrink-0 p-1.5 flex items-center justify-center">
                  {item.product?.main_image?.image_url ? (
                    <Image
                      src={item.product.main_image.image_url}
                      alt={item.product?.name || ''}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400">No Image</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <Link
                      href={`/products/${item.product?.slug}`}
                      onClick={closeCart}
                      className="font-serif text-gray-900 font-medium hover:text-brand-gold transition-colors line-clamp-2 text-sm leading-snug"
                    >
                      {item.product?.name}
                    </Link>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors shrink-0 touch-target"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-brand-gold font-bold text-sm mb-2.5">
                    {formatPrice(Number(item.unit_price))}
                  </p>
                  {/* Quantity */}
                  <div className="mt-auto flex items-center bg-gray-50 border border-gray-200 rounded-xl w-[100px] h-9">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-9 h-full flex items-center justify-center text-gray-500 hover:text-brand-dark transition-colors font-medium"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center font-bold text-sm text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-9 h-full flex items-center justify-center text-gray-500 hover:text-brand-dark transition-colors font-medium"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {(cart?.items?.length || 0) > 0 && (
        <div className="p-4 md:p-6 bg-white border-t border-gray-100 shadow-[0_-8px_20px_rgba(0,0,0,0.04)] shrink-0 safe-bottom">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium text-sm md:text-base">Subtotal</span>
            <span className="text-xl md:text-2xl font-serif text-brand-dark font-bold">
              {formatPrice(Number(cart?.subtotal || 0))}
            </span>
          </div>
          <Link
            href="/checkout"
            onClick={closeCart}
            className="w-full btn-modern bg-brand-dark text-white h-13 md:h-14 py-3.5 md:py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-brand-gold transition-colors shadow-lg shadow-brand-dark/10 text-sm md:text-base"
          >
            Proceed to Checkout <ArrowRight size={17} />
          </Link>
          <p className="text-center text-xs text-gray-400 mt-3 font-light">
            Shipping &amp; taxes calculated at checkout.
          </p>
        </div>
      )}
    </>
  );
}
