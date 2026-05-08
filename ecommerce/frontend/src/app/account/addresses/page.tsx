'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { accountApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { MapPin, Loader2, Plus, Trash2, X, Home, Briefcase, Globe } from 'lucide-react';
import Link from 'next/link';

const COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' },
];

const INITIAL_FORM = {
  full_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'GB',
  is_default: false,
};

export default function AddressesPage() {
  const { isAuthenticated } = useAuthStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  const fetchAddresses = () => {
    accountApi.getAddresses().then((res) => {
      setAddresses(res.data.results || res.data || []);
    }).catch(() => toast.error('Failed to load addresses'))
      .finally(() => setLoading(false));
  };

  const handleEdit = (addr: any) => {
    setForm({
      full_name: addr.full_name,
      phone: addr.phone,
      address_line_1: addr.address_line_1,
      address_line_2: addr.address_line_2 || '',
      city: addr.city,
      state: addr.state || '',
      postal_code: addr.postal_code,
      country: addr.country,
      is_default: addr.is_default,
    });
    setEditingId(addr.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      try {
        await accountApi.deleteAddress(id);
        toast.success('Address deleted');
        fetchAddresses();
      } catch {
        toast.error('Failed to delete address');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await accountApi.updateAddress(editingId, form);
        toast.success('Address updated');
      } else {
        await accountApi.addAddress(form);
        toast.success('Address added');
      }
      setIsFormOpen(false);
      setForm(INITIAL_FORM);
      setEditingId(null);
      fetchAddresses();
    } catch {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="pt-[100px] bg-[#fdfdfd] min-h-screen pb-24">
      {/* Header */}
      <div className="bg-brand-dark text-white py-12 mb-[-48px]">
        <div className="container max-w-5xl mx-auto px-6">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-brand-gold hover:text-white transition-colors mb-4">
            ← Back to Account
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <h1 className="text-3xl font-serif font-bold">Saved Addresses</h1>
            {!isFormOpen && (
              <button 
                onClick={() => { setIsFormOpen(true); setEditingId(null); setForm(INITIAL_FORM); }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-brand-gold text-brand-dark font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand-gold/10 hover:scale-105 active:scale-95"
              >
                <Plus size={16} /> Add New Address
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/[0.03] border border-gray-50 p-8 md:p-12">
          
          {isFormOpen ? (
            <div className="mb-12 bg-gray-50/50 p-8 md:p-10 rounded-[2rem] border border-gray-100 relative">
              <button onClick={() => setIsFormOpen(false)} className="absolute right-6 top-6 text-gray-400 hover:text-brand-dark transition-colors">
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-serif font-bold text-brand-dark mb-8">
                {editingId ? 'Update Address' : 'New Shipping Address'}
              </h2>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1">Recipient Full Name *</label>
                  <input
                    required
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:border-brand-gold outline-none bg-white font-medium"
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1">Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:border-brand-gold outline-none bg-white font-medium"
                    placeholder="+44 ..."
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1">Country *</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:border-brand-gold outline-none bg-white font-medium cursor-pointer"
                  >
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1">Street Address *</label>
                  <input
                    required
                    type="text"
                    value={form.address_line_1}
                    onChange={(e) => setForm({ ...form, address_line_1: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:border-brand-gold outline-none bg-white font-medium"
                    placeholder="House number and street name"
                  />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1">Apartment, suite, etc. (optional)</label>
                  <input
                    type="text"
                    value={form.address_line_2}
                    onChange={(e) => setForm({ ...form, address_line_2: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:border-brand-gold outline-none bg-white font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1">City / Town *</label>
                  <input
                    required
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:border-brand-gold outline-none bg-white font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1">Postcode / ZIP *</label>
                  <input
                    required
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-100 focus:border-brand-gold outline-none bg-white font-medium"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.is_default}
                      onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                      className="w-5 h-5 accent-brand-gold"
                    />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-brand-dark transition-colors">Set as my default shipping address</span>
                  </label>
                </div>

                <div className="md:col-span-2 pt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-brand-dark text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-gold transition-all shadow-xl shadow-brand-dark/10 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="text-gray-500 font-bold text-xs uppercase tracking-widest px-10 py-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-brand-gold" size={32} />
              <p className="text-sm font-bold text-gray-400">Loading addresses...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-200">
                <MapPin size={32} />
              </div>
              <h3 className="text-lg font-serif font-bold text-gray-400 mb-2">No addresses saved</h3>
              <p className="text-gray-400 text-sm mb-0">Add your first address to enjoy faster checkout.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {addresses.map((addr) => (
                <div key={addr.id} className="group relative bg-white border border-gray-100 rounded-[2rem] p-8 hover:border-brand-gold/30 hover:shadow-2xl hover:shadow-brand-dark/5 transition-all duration-500">
                  {addr.is_default && (
                    <div className="absolute -top-3 left-8 bg-brand-gold text-brand-dark text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1.5 ring-4 ring-white">
                      <Home size={10} /> Default Address
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-colors">
                      {addr.country === 'GB' ? <Home size={20} /> : <Globe size={20} />}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(addr)}
                        className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-brand-dark hover:bg-gray-100 transition-all"
                        title="Edit"
                      >
                        <Plus size={18} className="rotate-45" style={{ transform: 'rotate(0deg)' }} /> {/* Dummy edit icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(addr.id)} 
                        className="p-2 rounded-xl bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-brand-dark mb-4 tracking-tight">{addr.full_name}</h3>
                  
                  <div className="space-y-1.5 mb-6">
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">{addr.address_line_1}</p>
                    {addr.address_line_2 && <p className="text-sm font-medium text-gray-600 leading-relaxed">{addr.address_line_2}</p>}
                    <p className="text-sm font-black text-brand-dark">{addr.city}, {addr.state} {addr.postal_code}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-1">{addr.country}</p>
                  </div>

                  <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">{addr.phone}</span>
                    {!addr.is_default && (
                      <button 
                        onClick={() => handleEdit({...addr, is_default: true})}
                        className="text-[10px] font-black text-brand-gold uppercase tracking-widest hover:text-brand-dark transition-colors"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
