'use client';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Database, Save, ShieldCheck, Globe, CreditCard } from 'lucide-react';

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    if (!confirm('This will seed the database with sample products and categories. Continue?')) return;
    setLoading(true);
    try {
      await api.post('/admin/seed');
      toast.success('Database seeded successfully');
      window.location.reload();
    } catch {
      toast.error('Failed to seed database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-2">Configure your store preferences and system utilities.</p>
      </div>

      <div className="space-y-8">
        {/* System Utilities */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Database className="text-brand-gold" size={24} />
            <h2 className="text-xl font-serif font-bold text-brand-dark">System Utilities</h2>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="font-bold text-brand-dark">Seed Database</h3>
                <p className="text-sm text-gray-500 mt-1">Populate your store with premium sample products and categories if the database is empty.</p>
              </div>
              <button 
                onClick={handleSeed}
                disabled={loading}
                className="whitespace-nowrap px-8 py-3 bg-brand-dark text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Seeding...' : 'Run Seed Script'}
              </button>
            </div>
          </div>
        </div>

        {/* Store Configuration Placeholder */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 opacity-60">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="text-gray-400" size={24} />
            <h2 className="text-xl font-serif font-bold text-gray-400">Store Front (Coming Soon)</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 border border-gray-100 rounded-xl flex items-center justify-between">
              <span className="text-sm font-medium">SEO & Meta Tags</span>
              <div className="w-10 h-5 bg-gray-200 rounded-full relative"></div>
            </div>
            <div className="p-4 border border-gray-100 rounded-xl flex items-center justify-between">
              <span className="text-sm font-medium">Payment Gateways</span>
              <CreditCard size={18} className="text-gray-300" />
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 opacity-60">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-gray-400" size={24} />
            <h2 className="text-xl font-serif font-bold text-gray-400">Security Settings</h2>
          </div>
          <p className="text-sm text-gray-400 italic">Security configurations are managed via environment variables.</p>
        </div>
      </div>
    </div>
  );
}
