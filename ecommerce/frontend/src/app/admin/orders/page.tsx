'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useCurrencyStore } from '@/lib/store';
import { ShoppingBag, Search, ExternalLink, Clock, CheckCircle2, Truck, XCircle, Package } from 'lucide-react';
import Link from 'next/link';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { formatPrice } = useCurrencyStore();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data.orders || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      toast.success('Status updated');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-brand-gold/10 text-brand-gold border-brand-gold/20';
    }
  };

  const exportCsv = async () => {
    try {
      const res = await api.get('/admin/orders/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export downloaded');
    } catch {
      toast.error('Failed to export orders');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
    (o.user?.email || o.shippingName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-2">Process and manage your customer transactions.</p>
        </div>
        <button
          onClick={exportCsv}
          className="px-5 py-2.5 bg-brand-dark text-white rounded-xl font-bold hover:bg-brand-gold transition-colors flex items-center gap-2 text-sm shadow-sm"
        >
          <ExternalLink size={16} /> Export to CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by order #, email, or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-gray-100">
                <th className="p-4">Order Details</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500 font-medium">Loading orders...</td></tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-gold/10 text-brand-gold flex items-center justify-center">
                        <ShoppingBag size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark">#{order.orderNumber}</p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-700">{order.user ? `${order.user.firstName} ${order.user.lastName}` : order.shippingName}</p>
                    <p className="text-xs text-gray-400">{order.user?.email || 'Guest Order'}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-brand-dark">{formatPrice(Number(order.totalAmount))}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{order.items?.length || 0} items</p>
                  </td>
                  <td className="p-4">
                    <select 
                      value={order.status} 
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border focus:outline-none transition-all cursor-pointer ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/account/orders/${order.orderNumber}`} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold uppercase hover:bg-brand-dark hover:text-white transition-all border border-gray-100"
                      >
                        Details <ExternalLink size={12} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && !loading && (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500 font-medium">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
