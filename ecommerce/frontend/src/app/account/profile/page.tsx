'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { accountApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { User as UserIcon, Loader2, Mail, ShieldCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isAuthenticated) {
      accountApi.getUser().then((res) => {
        setProfile(res.data);
      }).catch(() => toast.error('Failed to load profile'))
        .finally(() => setLoading(false));
    }
  }, [mounted, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await accountApi.updateUser(profile);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center pt-[80px]">
      <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return null;

  return (
    <div className="pt-[100px] bg-[#fdfdfd] min-h-screen pb-24">
      {/* Header */}
      <div className="bg-brand-dark text-white py-12 mb-[-48px]">
        <div className="container max-w-4xl mx-auto px-6">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-brand-gold hover:text-white transition-colors mb-4">
            ← Back to Account
          </Link>
          <h1 className="text-3xl font-serif font-bold">Profile Details</h1>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/[0.03] border border-gray-50 p-8 md:p-12">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-brand-gold" size={32} />
              <p className="text-sm font-bold text-gray-400">Loading profile...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Left Side: Info */}
              <div className="lg:col-span-1 space-y-8">
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                  <div className="w-24 h-24 rounded-3xl bg-brand-dark flex items-center justify-center text-brand-gold mb-6 shadow-xl shadow-brand-dark/20 ring-4 ring-brand-gold/5">
                    <UserIcon size={40} />
                  </div>
                  <h2 className="text-xl font-bold text-brand-dark">{profile.first_name} {profile.last_name}</h2>
                  <p className="text-sm text-gray-400 font-medium">{profile.email}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-brand-gold shadow-sm">
                      <Mail size={14} />
                    </div>
                    <span className="text-xs font-bold text-gray-600">Email Verified</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm">
                      <ShieldCheck size={14} />
                    </div>
                    <span className="text-xs font-bold text-gray-600">Secure Account</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1">First Name</label>
                      <input
                        type="text"
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl text-brand-dark outline-none bg-gray-50 border border-gray-100 focus:border-brand-gold focus:bg-white focus:ring-4 focus:ring-brand-gold/5 transition-all font-medium"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1">Last Name</label>
                      <input
                        type="text"
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl text-brand-dark outline-none bg-gray-50 border border-gray-100 focus:border-brand-gold focus:bg-white focus:ring-4 focus:ring-brand-gold/5 transition-all font-medium"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1">Email Address</label>
                    <div className="relative group">
                      <input
                        disabled
                        type="email"
                        value={profile.email}
                        className="w-full px-6 py-4 rounded-2xl text-gray-400 outline-none bg-gray-50/50 border border-gray-100 cursor-not-allowed font-medium"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Lock size={16} className="text-gray-300" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 italic ml-1">Email cannot be changed for security reasons.</p>
                  </div>

                  <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <p className="text-xs text-gray-400">Manage your password and other settings in the security tab.</p>
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto bg-brand-dark hover:bg-brand-gold text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 shadow-xl shadow-brand-dark/10 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Lock({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
