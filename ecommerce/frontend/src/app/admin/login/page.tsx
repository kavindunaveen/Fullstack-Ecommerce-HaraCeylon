'use client';
import { Suspense, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function AdminLoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';
  const setAuth = useAuthStore(s => s.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/login', {
        email,
        password
      });
      
      setAuth(res.data.user, res.data.access, res.data.refresh);
      toast.success('Admin authenticated successfully');
      router.push(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
        
        {/* Subtle Brand Background Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full -mr-16 -mt-16" />
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
             <img src="/logo.webp" alt="" className="w-10 h-10 object-contain invert brightness-0" />
          </div>
          <h1 className="text-2xl font-serif font-black text-brand-dark">Management Login</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Secure Administrator Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="email" required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:bg-white transition-all text-sm font-medium"
                placeholder="admin@haraceylon.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="password" required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:bg-white transition-all text-sm font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-brand-dark text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-dark/10 hover:bg-brand-gold hover:shadow-brand-gold/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            Authenticate
          </button>
        </form>

        <div className="mt-10 text-center">
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-brand-dark transition-colors flex items-center justify-center gap-2">
            <ArrowLeft size={12} /> Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-dark flex items-center justify-center text-white">Loading Portal...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}
