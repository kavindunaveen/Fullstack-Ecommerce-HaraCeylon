'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import { Mail, Shield, User, Clock, ShoppingBag } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
  _count: {
    orders: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchCustomers(token);
  }, []);

  const fetchCustomers = async (token: string) => {
    try {
      const res = await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data.users);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load customers');
      setLoading(false);
    }
  };

  const toggleRole = async (customerId: string, currentRole: string) => {
    const token = localStorage.getItem('admin_token');
    const newRole = currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    setUpdatingId(customerId);
    try {
      await axios.patch(`${API_BASE}/admin/users/${customerId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User role updated');
      setCustomers(customers.map(c => c.id === customerId ? { ...c, role: newRole } : c));
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-gray-800">Customer Management</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
            Total Users: {customers.length}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-gray-500">Loading customers...</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                              <User size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{customer.firstName} {customer.lastName}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail size={12} /> {customer.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-[10px] font-bold rounded-full border ${
                            customer.role === 'ADMIN' 
                              ? 'bg-purple-50 text-purple-700 border-purple-100' 
                              : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {customer.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <ShoppingBag size={14} className="text-gray-400" />
                            {customer._count.orders}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button 
                            onClick={() => toggleRole(customer.id, customer.role)}
                            disabled={updatingId === customer.id}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          >
                            {customer.role === 'ADMIN' ? 'Make Customer' : 'Make Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
