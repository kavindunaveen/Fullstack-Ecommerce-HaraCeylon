'use client';
import { useCartStore, useCurrencyStore } from '@/lib/store';
import { cartApi } from '@/lib/api';
import { X, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
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
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-[200]" 
            onClick={closeCart} 
          />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[440px] bg-white z-[201] flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-brand-dark" />
                <h2 className="font-serif text-2xl font-bold text-brand-dark">Your Bag</h2>
                {(cart?.item_count || 0) > 0 && (
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {cart?.item_count}
                  </span>
                )}
              </div>
              <button onClick={closeCart} className="p-2 text-gray-400 hover:text-brand-dark hover:bg-gray-50 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {(!cart?.items || cart.items.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center space-y-4">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <ShoppingBag size={32} strokeWidth={1.5} className="text-gray-300" />
                  </div>
                  <p className="font-light text-lg">Your bag is empty.</p>
                  <button onClick={closeCart} className="text-brand-gold font-medium hover:underline">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cart.items.map((item: CartItem) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 shrink-0 p-2 flex items-center justify-center">
                        {item.product?.main_image?.image_url ? (
                          <img
                            src={item.product.main_image.image_url}
                            alt={item.product.main_image.alt_text || item.product.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">No Image</span>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <Link
                            href={`/products/${item.product?.slug}`}
                            onClick={closeCart}
                            className="font-serif text-gray-900 font-medium hover:text-brand-gold transition-colors line-clamp-2"
                          >
                            {item.product?.name}
                          </Link>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-brand-dark font-medium text-sm mb-3">
                          {formatPrice(Number(item.unit_price))}
                        </p>
                        {/* Quantity Controls */}
                        <div className="mt-auto flex items-center bg-gray-50 border border-gray-200 rounded-lg w-28 h-8 px-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-brand-dark transition-colors"
                          >
                            -
                          </button>
                          <span className="flex-1 text-center font-medium text-sm text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-brand-dark transition-colors"
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

            {(cart?.items?.length || 0) > 0 && (
              <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="text-2xl font-serif text-brand-dark font-bold">
                    {formatPrice(Number(cart?.subtotal || 0))}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full btn-modern bg-brand-dark text-white h-14 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-brand-gold transition-colors shadow-lg shadow-brand-dark/10"
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </Link>
                <p className="text-center text-xs text-gray-400 mt-4 font-light">
                  Shipping &amp; taxes calculated at checkout.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
