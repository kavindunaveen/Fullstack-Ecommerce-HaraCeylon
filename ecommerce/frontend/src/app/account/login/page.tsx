'use client';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);

  const [formData, setFormData] = useState({
    email: '', password: '', first_name: '', last_name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await authApi.login({ email: formData.email, password: formData.password });
        setAuth(res.data.user, res.data.access, res.data.refresh);
        toast.success('Logged in successfully');
        if (res.data.user.is_staff) router.push('/admin');
        else router.push('/account');
      } else {
        const res = await authApi.register(formData);
        setAuth(res.data.user, res.data.access, res.data.refresh);
        toast.success('Account created successfully');
        router.push('/account');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-[80px] bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="bg-white max-w-md w-full p-8 rounded-[2rem] shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img src="/logo.webp" alt="Hara Ceylon" className="h-12 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-serif font-bold text-gray-900">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-sm text-gray-500 mt-2">{isLogin ? 'Sign in to access your account' : 'Join Hara Ceylon today'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input required type="text" className="form-control" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input required type="text" className="form-control" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input required type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input required type="password" className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-brand-gold transition-all shadow-lg disabled:opacity-50 mt-6">
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-brand-gold hover:underline">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
