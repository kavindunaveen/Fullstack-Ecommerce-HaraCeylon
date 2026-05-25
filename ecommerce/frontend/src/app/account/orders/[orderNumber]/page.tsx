'use client';
import { useEffect, useState, use } from 'react';
import { useAuthStore, useCurrencyStore } from '@/lib/store';
import { accountApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  Package, MapPin, ChevronLeft, CreditCard, 
  Truck, Clock, CheckCircle2, XCircle, Printer
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const BACKEND_URL = API_BASE.replace('/api', '');

const formatStatus = (s: string) =>
  s?.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-brand-gold/10 text-brand-gold border-brand-gold/20';
  }
};

export default function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const { isAuthenticated } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push('/account/login');
      return;
    }
    accountApi.getOrder(orderNumber)
      .then(res => setOrder(res.data))
      .catch(() => toast.error('Could not load order details'))
      .finally(() => setLoading(false));
  }, [mounted, isAuthenticated, orderNumber, router]);

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center pt-[80px]">
      <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return null;

  if (loading) return (
    <div className="pt-[150px] pb-24 min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="spinner w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-bold text-gray-400">Loading order details...</p>
    </div>
  );

  if (!order) return (
    <div className="pt-[150px] pb-24 min-h-screen text-center">
      <h1 className="text-2xl font-serif font-bold text-gray-400">Order not found</h1>
      <Link href="/account" className="btn btn-primary mt-6">Back to Orders</Link>
    </div>
  );

  return (
    <div className="pt-[100px] bg-[#fdfdfd] min-h-screen pb-24 font-sans">
      <div className="container max-w-5xl mx-auto px-6">
        
        {/* Breadcrumbs / Back */}
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-brand-gold hover:text-brand-dark transition-colors">
            <ChevronLeft size={16} /> Back to My Orders
          </Link>
        </div>

        {/* Order Header Card */}
        <div className="bg-brand-dark text-white rounded-[2.5rem] p-8 md:p-12 mb-8 shadow-2xl shadow-brand-dark/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-white/10 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest text-brand-gold border border-white/5">
                    Order Details
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.order_status)}`}>
                    {formatStatus(order.order_status)}
                  </span>
                </div>
                <h1 className="text-4xl font-serif font-bold tracking-tight mb-2">
                  Order <span className="text-brand-gold">#{order.order_number}</span>
                </h1>
                <p className="text-gray-400 font-medium">
                  Placed on {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-all font-bold text-sm border border-white/10 backdrop-blur-sm">
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
          {/* Abstract background elements */}
          <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-brand-gold/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-20%] left-[-5%] w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ── Left Side: Items & Summary ────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Order Items */}
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl shadow-black/[0.02] border border-gray-50">
              <h2 className="text-xl font-serif font-bold text-brand-dark mb-8 flex items-center gap-3">
                <Package size={20} className="text-brand-gold" /> Items Ordered
              </h2>
              <div className="space-y-6">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-6 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl p-2 flex items-center justify-center shrink-0 border border-gray-100">
                      {item.image_url_snapshot && (
                        <Image 
                          src={item.image_url_snapshot} 
                          alt={item.product_name_snapshot} 
                          width={64}
                          height={64}
                          className="w-full h-full object-contain" 
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-brand-dark mb-1">{item.product_name_snapshot}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">{item.sku_snapshot}</p>
                      <p className="text-sm font-medium text-gray-500">Qty: <span className="text-brand-dark font-bold">{item.quantity}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-brand-dark">{formatPrice(Number(item.total_price))}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{formatPrice(Number(item.unit_price))} / unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl shadow-black/[0.02] border border-gray-50">
              <div className="space-y-4">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal</span>
                  <span className="text-brand-dark font-bold">{formatPrice(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span>Shipping</span>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded uppercase font-black">{order.shipping_method_name}</span>
                  </div>
                  <span className="text-brand-dark font-bold">{formatPrice(Number(order.shipping_total))}</span>
                </div>
                {Number(order.discount_total) > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount {order.coupon_code_snapshot && `(${order.coupon_code_snapshot})`}</span>
                    <span>-{formatPrice(Number(order.discount_total))}</span>
                  </div>
                )}
                {Number(order.tax_total) > 0 && (
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Tax</span>
                    <span className="text-brand-dark font-bold">{formatPrice(Number(order.tax_total))}</span>
                  </div>
                )}
                <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-serif font-bold text-brand-dark">Grand Total</span>
                  <span className="text-3xl font-serif font-black text-brand-dark">{formatPrice(Number(order.grand_total))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Side: Details ─────────────────────── */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Delivery Status */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-black/[0.02] border border-gray-50">
              <h2 className="text-lg font-serif font-bold text-brand-dark mb-6 flex items-center gap-3">
                <Truck size={18} className="text-brand-gold" /> Delivery Status
              </h2>
              <div className="space-y-6">
                {order.status_history?.map((history: any, idx: number) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx !== order.status_history.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-gray-100" />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${idx === 0 ? 'bg-brand-gold text-brand-dark' : 'bg-gray-100 text-gray-300'}`}>
                      {idx === 0 ? <CheckCircle2 size={12} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark">{formatStatus(history.to_status)}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{new Date(history.changed_at).toLocaleDateString()} {new Date(history.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      {history.note && <p className="text-xs text-gray-500 mt-1 italic">"{history.note}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-black/[0.02] border border-gray-50">
              <h2 className="text-lg font-serif font-bold text-brand-dark mb-6 flex items-center gap-3">
                <MapPin size={18} className="text-brand-gold" /> Shipping To
              </h2>
              <div className="space-y-1.5">
                <p className="font-black text-brand-dark text-sm">{order.shipping_address_snapshot.full_name}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{order.shipping_address_snapshot.address_line_1}</p>
                {order.shipping_address_snapshot.address_line_2 && (
                  <p className="text-sm text-gray-600 leading-relaxed">{order.shipping_address_snapshot.address_line_2}</p>
                )}
                <p className="text-sm font-bold text-brand-dark">{order.shipping_address_snapshot.city}, {order.shipping_address_snapshot.state} {order.shipping_address_snapshot.postal_code}</p>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest pt-2">{order.shipping_address_snapshot.country}</p>
                <p className="text-xs font-bold text-brand-gold mt-4">{order.shipping_address_snapshot.phone}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-black/[0.02] border border-gray-50">
              <h2 className="text-lg font-serif font-bold text-brand-dark mb-6 flex items-center gap-3">
                <CreditCard size={18} className="text-brand-gold" /> Payment
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-dark">{formatStatus(order.payment_method)}</p>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">{formatStatus(order.payment_status)}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.payment_status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                  {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
