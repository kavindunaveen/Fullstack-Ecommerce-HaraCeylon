'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useCurrencyStore } from '@/lib/store';
import { DollarSign, ShoppingCart, Users, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  total_revenue: number;
  today_revenue: number;
  active_orders: number;
  total_customers: number;
  low_stock_items: number;
  total_orders: number;
  today_orders: number;
  new_customers_today: number;
  pending_orders: number;
  low_stock_products?: any[];
  recent_orders: {
    order_number: string;
    customer_name: string;
    order_status: string;
    grand_total: string | number;
  }[];
}

/** Convert snake_case status to a readable label, e.g. 'pending_payment' → 'Pending Payment' */
const formatStatus = (s: string) =>
  s.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => {
        const { stats: s, recentOrders } = res.data;
        setStats({
          total_revenue: s.totalRevenue,
          today_revenue: 0, // Mocked for now, backend could provide
          active_orders: s.totalOrders,
          total_customers: s.totalCustomers,
          low_stock_items: 0,
          total_orders: s.totalOrders,
          today_orders: 0,
          new_customers_today: 0,
          pending_orders: recentOrders.filter((o: any) => o.status === 'pending').length,
          recent_orders: recentOrders.map((o: any) => ({
            order_number: o.id,
            customer_name: o.customer,
            order_status: o.status,
            grand_total: o.total,
            created_at: o.date,
            customer_email: o.customer // Fallback
          }))
        } as DashboardStats);
      })
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="spinner border-brand-dark"></div></div>;
  if (!stats) return null;

  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-2">Here's what's happening with your store today.</p>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-brand-dark"><DollarSign size={48} /></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 font-serif">{formatPrice(Number(stats.total_revenue))}</p>
          <p className="text-xs text-green-500 mt-2 font-bold">+{formatPrice(Number(stats.today_revenue))} today</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-brand-dark"><ShoppingCart size={48} /></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 font-serif">{stats.total_orders}</p>
          <p className="text-xs text-green-500 mt-2 font-bold">+{stats.today_orders} today</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-brand-dark"><Users size={48} /></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customers</p>
          <p className="text-3xl font-bold text-gray-900 font-serif">{stats.total_customers}</p>
          <p className="text-xs text-green-500 mt-2 font-bold">+{stats.new_customers_today} today</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden border-l-4 border-l-brand-gold">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-brand-gold"><AlertTriangle size={48} /></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pending Orders</p>
          <p className="text-3xl font-bold text-brand-gold font-serif">{stats.pending_orders}</p>
          <p className="text-xs text-gray-500 mt-2 font-bold">Requires action</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-serif font-bold text-gray-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-bold">Order #</th>
                  <th className="p-4 font-bold">Customer</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recent_orders?.map((order: any) => (
                  <tr key={order.order_number} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-brand-dark">{order.order_number}</td>
                    <td className="p-4 text-sm text-gray-600">{order.customer_email || order.guest_email}</td>
                    <td className="p-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.order_status === 'delivered' ? 'bg-green-100 text-green-700' : 
                        order.order_status === 'pending_payment' ? 'bg-red-100 text-red-700' : 'bg-brand-gold/10 text-brand-gold'
                      }`}>
                        {formatStatus(order.order_status)}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-right">{formatPrice(Number(order.grand_total))}</td>
                  </tr>
                ))}
                {(!stats.recent_orders || stats.recent_orders.length === 0) && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No recent orders</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">Low Stock Alerts</h2>
            {(stats.low_stock_products?.length ?? 0) > 0 ? (
              <ul className="space-y-3">
                {stats.low_stock_products?.map((p: any) => (
                  <li key={p.id} className="flex justify-between items-center text-sm p-3 bg-red-50 text-red-700 rounded-lg">
                    <span className="font-bold line-clamp-1">{p.name}</span>
                    <span className="flex-shrink-0 bg-red-100 px-2 py-1 rounded text-xs">{p.stock_quantity} left</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg text-center">Inventory looks good.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
