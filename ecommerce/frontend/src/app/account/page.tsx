'use client';
import { useEffect, useState } from 'react';
import { useAuthStore, useCurrencyStore } from '@/lib/store';
import { accountApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  Package, MapPin, User as UserIcon, LogOut, 
  ChevronRight, ShoppingBag, Clock, CheckCircle2, 
  XCircle, Truck, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const BACKEND_URL = API_BASE.replace('/api', '');

interface Order {
  order_number: string;
  order_status: string;
  created_at: string;
  grand_total: string | number;
  items?: any[];
}

const formatStatus = (s: string) =>
  s.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'processing': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-brand-gold/10 text-brand-gold border-brand-gold/20';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered': return <CheckCircle2 size={14} />;
    case 'cancelled': return <XCircle size={14} />;
    case 'shipped': return <Truck size={14} />;
    case 'processing': return <Clock size={14} />;
    default: return <Package size={14} />;
  }
};

export default function AccountPage() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/account/login');
      return;
    }
    accountApi.getOrders()
      .then(res => setOrders(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="pt-[100px] bg-[#fdfdfd] min-h-screen pb-24">
      {/* Premium Header Section */}
      <div className="bg-brand-dark text-white py-16 mb-[-64px]">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
                My <span className="text-brand-gold">Account</span>
              </h1>
              <p className="text-gray-400 text-lg">
                Welcome back, <span className="text-white font-medium">{user.first_name}</span>. Managing your orders and profile.
              </p>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all border border-white/10 backdrop-blur-sm"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ── Sidebar Navigation ─────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            <nav className="bg-white rounded-3xl p-6 shadow-xl shadow-black/5 border border-gray-100 flex flex-col gap-2 sticky top-28">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 px-3">Navigation</p>
              
              <Link href="/account" className="flex items-center justify-between group p-3.5 rounded-2xl bg-brand-dark text-brand-gold font-bold transition-all shadow-lg shadow-brand-dark/10">
                <div className="flex items-center gap-3">
                  <ShoppingBag size={20} />
                  <span>Orders</span>
                </div>
                <ChevronRight size={16} className="opacity-50" />
              </Link>
              
              <Link href="/account/addresses" className="flex items-center justify-between group p-3.5 rounded-2xl hover:bg-gray-50 text-gray-500 hover:text-brand-dark transition-all font-medium">
                <div className="flex items-center gap-3 text-gray-400 group-hover:text-brand-gold">
                  <MapPin size={20} />
                  <span className="text-gray-600">Addresses</span>
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
              </Link>
              
              <Link href="/account/profile" className="flex items-center justify-between group p-3.5 rounded-2xl hover:bg-gray-50 text-gray-500 hover:text-brand-dark transition-all font-medium">
                <div className="flex items-center gap-3 text-gray-400 group-hover:text-brand-gold">
                  <UserIcon size={20} />
                  <span className="text-gray-600">Profile Details</span>
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
              </Link>

              {user?.is_staff && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 px-3">Administration</p>
                  <Link href="/admin" className="flex items-center gap-3 p-4 rounded-2xl bg-brand-gold text-brand-dark font-black hover:scale-[1.02] active:scale-95 transition-all shadow-md">
                    <UserIcon size={18} /> Admin Dashboard
                  </Link>
                </div>
              )}
            </nav>
          </div>

          {/* ── Main Content ─────────────────────────────────── */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-brand-gold transition-all cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black text-brand-dark">{orders.length}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Orders</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-brand-gold transition-all cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black text-brand-dark">
                    {orders.filter(o => o.order_status === 'delivered').length}
                  </p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Delivered</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-brand-gold transition-all cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black text-brand-dark">
                    {orders.filter(o => !['delivered', 'cancelled'].includes(o.order_status)).length}
                  </p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">In Progress</p>
                </div>
              </div>
            </div>

            {/* Order History Table/List */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-black/[0.03] border border-gray-50">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-brand-dark">Order History</h2>
                  <p className="text-gray-400 text-sm mt-1">Review your recent purchases and their current status.</p>
                </div>
              </div>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="spinner w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-gray-400 animate-pulse">Loading your history...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-24 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-200">
                    <ShoppingBag size={40} />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-gray-400 mb-2">No orders yet</h3>
                  <p className="text-gray-400 text-sm mb-8">You haven't placed any orders with us yet.</p>
                  <Link href="/products" className="btn btn-primary px-10 rounded-full">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.order_number} className="group relative bg-white border border-gray-100 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center hover:border-brand-gold/30 hover:shadow-xl hover:shadow-brand-dark/5 transition-all duration-500">
                      
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm font-black text-brand-dark tracking-tighter bg-gray-50 px-3 py-1 rounded-lg">#{order.order_number}</span>
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border flex items-center gap-1.5 ${getStatusColor(order.order_status)}`}>
                            {getStatusIcon(order.order_status)}
                            {formatStatus(order.order_status)}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-400">Placed on <span className="text-gray-600 font-bold">{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                        </div>

                        {/* Items Preview */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 group-hover:border-brand-gold/20 transition-all">
                              {item.image_url_snapshot && (
                                <img 
                                  src={item.image_url_snapshot} 
                                  alt="" 
                                  className="w-5 h-5 object-contain" 
                                />
                              )}
                              <span className="text-[11px] font-bold text-gray-700">
                                {item.product_name_snapshot} <span className="text-gray-400 font-medium">x{item.quantity}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-6 w-full md:w-auto shrink-0 pt-6 md:pt-0 border-t md:border-t-0 border-gray-50">
                        <div className="text-left md:text-right">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Grand Total</p>
                          <p className="text-3xl font-serif font-black text-brand-dark">{formatPrice(Number(order.grand_total))}</p>
                        </div>
                        <Link 
                          href={`/account/orders/${order.order_number}`}
                          className="flex items-center gap-2 text-xs font-bold text-brand-gold hover:text-brand-dark transition-all px-4 py-2 bg-brand-gold/5 rounded-full border border-brand-gold/10 group-hover:bg-brand-gold group-hover:text-white group-hover:border-transparent"
                        >
                          View Details <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
