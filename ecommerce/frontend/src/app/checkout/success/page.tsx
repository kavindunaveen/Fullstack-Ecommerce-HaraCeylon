'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { checkoutApi } from '@/lib/api';
import { useCurrencyStore } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle2, Package, ArrowRight, ShoppingBag, 
  Mail, Truck, ChevronRight, Share2, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
const BACKEND_URL = API_BASE.replace(/\/api\/?$/, '');

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    if (orderNumber) {
      checkoutApi.getOrder(orderNumber)
        .then(res => setOrder(res.data))
        .catch(() => toast.error('Could not fetch order details'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-[80px] bg-white gap-4">
      <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-bold text-gray-400 animate-pulse">Confirming your order...</p>
    </div>
  );

  return (
    <div className="pt-[100px] bg-[#fdfdfd] min-h-screen pb-24">
      <div className="container max-w-4xl py-16 px-6 mx-auto">
        
        {/* Celebration Header */}
        <div className="text-center mb-16 relative">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/10 border-4 border-white animate-bounce-slow">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-5xl font-serif font-bold text-brand-dark mb-4 tracking-tight">Order <span className="text-brand-gold">Confirmed!</span></h1>
          <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed">
            Thank you for choosing <span className="font-bold text-brand-dark">Hara Ceylon</span>. Your order is being prepared with care and will be on its way soon.
          </p>
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 flex justify-center overflow-hidden">
             <div className="w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[100px] opacity-50" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* ── Left Side: Order Card ─────────────────────── */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-black/[0.03] border border-gray-50 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-50">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Order Reference</p>
                  <p className="text-2xl font-black text-brand-dark tracking-tight">#{orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Date</p>
                  <p className="font-bold text-gray-700">{order?.created_at ? new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Loading...'}</p>
                </div>
              </div>

              {order ? (
                <div className="space-y-8">
                  {/* Item List Preview */}
                  <div className="space-y-4">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4 group">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl border border-gray-100 p-1.5 flex items-center justify-center shrink-0">
                          {item.image_url_snapshot && (
                            <Image 
                              src={item.image_url_snapshot} 
                              alt="" 
                              width={48}
                              height={48}
                              className="w-full h-full object-contain" 
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-brand-dark line-clamp-1">{item.product_name_snapshot}</p>
                          <p className="text-xs text-gray-400">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-brand-dark">{formatPrice(Number(item.total_price))}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-gray-50 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2 text-brand-gold">
                        <MapPin size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Shipping To</span>
                      </div>
                      <p className="text-xs font-bold text-brand-dark leading-relaxed">
                        {order.shipping_address_snapshot?.full_name}<br />
                        {order.shipping_address_snapshot?.city}, {order.shipping_address_snapshot?.country}
                      </p>
                    </div>
                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2 text-brand-gold">
                        <Truck size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Method</span>
                      </div>
                      <p className="text-xs font-bold text-brand-dark leading-relaxed">
                        {order.shipping_method_name}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400 italic">
                  Loading final order details...
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
               <Link href="/products" className="flex-1 btn btn-primary py-5 rounded-2xl shadow-xl shadow-brand-dark/10 group">
                  <ShoppingBag size={18} className="mr-2 group-hover:scale-110 transition-transform" /> Continue Shopping
               </Link>
               <Link href="/account" className="flex-1 btn bg-white text-brand-dark hover:bg-gray-50 border border-gray-100 py-5 rounded-2xl shadow-sm group">
                  My Account <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
          </div>

          {/* ── Right Side: Info ──────────────────────────── */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Status Steps */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="font-serif font-bold text-brand-dark mb-6">What happens next?</h3>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0 border border-green-100">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">Order Confirmed</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">We've received your order and payment method has been verified.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">Order Recorded</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Your order details have been securely saved and can be viewed in your account dashboard.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100">
                    <Package size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">Preparation</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Our team is carefully packing your items for shipment.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter / Contact */}
            <div className="bg-brand-dark text-white p-8 rounded-[2rem] shadow-xl shadow-brand-dark/20 relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="font-serif font-bold text-brand-gold text-lg mb-2">Need help?</h3>
                 <p className="text-sm text-gray-400 mb-6">Our concierge team is available 24/7 to assist with your order.</p>
                 <Link href="/pages/contact" className="text-sm font-bold border-b-2 border-brand-gold text-brand-gold hover:text-white hover:border-white transition-all pb-1">
                    Contact Support
                 </Link>
               </div>
               <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center pt-[80px] bg-white gap-4">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-400">Loading...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
