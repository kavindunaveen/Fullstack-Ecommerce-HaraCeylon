'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/orders/');
      setOrders(res.data.results || res.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderNumber: string, status: string) => {
    try {
      await api.patch(`/reports/orders/${orderNumber}/status/`, { order_status: status });
      toast.success('Order status updated');
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="spinner border-brand-dark"></div></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-2">Manage all customer orders.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold">Order #</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order: any) => (
                <tr key={order.order_number} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-bold text-brand-dark">{order.order_number}</td>
                  <td className="p-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-sm text-gray-600">{order.customer_email || order.guest_email}</td>
                  <td className="p-4 font-bold">£{Number(order.grand_total).toFixed(2)}</td>
                  <td className="p-4">
                    <select 
                      value={order.order_status} 
                      onChange={(e) => updateStatus(order.order_number, e.target.value)}
                      className="text-xs font-bold uppercase tracking-wider p-2 border rounded bg-white"
                    >
                      <option value="pending_payment">Pending Payment</option>
                      <option value="pending_confirmation">Pending Confirmation (COD)</option>
                      <option value="processing">Processing</option>
                      <option value="packed">Packed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-brand-gold text-sm font-bold hover:underline">View</button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
