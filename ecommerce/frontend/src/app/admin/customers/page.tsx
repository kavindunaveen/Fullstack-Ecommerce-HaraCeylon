'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Users as UsersIcon, Shield, User as UserIcon, Search, Mail } from 'lucide-react';

export default function AdminCustomers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    if (!confirm(`Are you sure you want to make this user a ${newRole}?`)) return;
    
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      toast.error('Failed to update role');
    }
  };

  const filteredUsers = users.filter(u => 
    (u.firstName + ' ' + u.lastName).toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 mt-2">Manage your registered users and administrative staff.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
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
                <th className="p-4">User Details</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Orders</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500 font-medium">Loading user database...</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.role === 'ADMIN' ? 'bg-brand-gold/10 text-brand-gold' : 'bg-brand-green/10 text-brand-green'}`}>
                        {user.role === 'ADMIN' ? <Shield size={18} /> : <UserIcon size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark">{user.firstName} {user.lastName}</p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium lowercase">
                          <Mail size={10} /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      user.role === 'ADMIN' ? 'bg-brand-gold text-white border-transparent shadow-sm' : 'bg-white text-gray-500 border-gray-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500 font-medium">
                    {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-brand-dark">{user._count?.orders || 0}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Placed</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end">
                      <button 
                        onClick={() => toggleRole(user.id, user.role)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
                          user.role === 'ADMIN' 
                            ? 'text-red-500 border-red-100 hover:bg-red-50' 
                            : 'text-brand-gold border-brand-gold/10 hover:bg-brand-gold hover:text-white'
                        }`}
                      >
                        {user.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && !loading && (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500 font-medium">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
