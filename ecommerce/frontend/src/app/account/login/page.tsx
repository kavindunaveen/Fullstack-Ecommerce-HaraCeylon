'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import { authApi } from '@/lib/api';
import { Eye, EyeOff, Mail, Lock, User as UserIcon } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';
  const defaultTab = searchParams.get('signup') === 'true' ? 'register' : 'login';

  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSuccess = (data: any) => {
    setAuth(data.user, data.access, data.refresh);
    toast.success(tab === 'register' ? 'Account created! Welcome to HARA Ceylon.' : 'Welcome back!');
    if (redirect) return router.push(redirect);
    if (data.user.is_staff) return router.push('/admin');
    router.push('/account');
  };

  // ── Google SSO ─────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/`, {
        credential: credentialResponse.credential
      });
      onSuccess(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Email Login ─────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please enter your email and password.');
    setLoading(true);
    try {
      const res = await authApi.login({ email: form.email, password: form.password });
      onSuccess(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── Email Registration ──────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Email and password are required.');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      const res = await authApi.register({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
      });
      onSuccess(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-gold focus:bg-white transition-all";

  return (
    <div className="pt-[80px] bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="bg-white max-w-md w-full p-10 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Logo */}
        <Link href="/" className="inline-block mb-6 text-center w-full">
          <h2 className="font-serif text-3xl font-black text-brand-dark">
            HARA <span className="text-brand-gold italic font-light">CEYLON</span>
          </h2>
        </Link>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === 'login' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === 'register' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* ── Google SSO ─────────────────────────── */}
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google Sign-In failed or was cancelled')}
            shape="pill"
            theme="outline"
            size="large"
            text={tab === 'register' ? 'signup_with' : 'continue_with'}
            width="300px"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">or with email</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* ── Login Form ─────────────────────────── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                name="email" type="email" required
                placeholder="Email address"
                value={form.email} onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                name="password" type={showPassword ? 'text' : 'password'} required
                placeholder="Password"
                value={form.password} onChange={handleChange}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-dark text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg disabled:opacity-50"
            >
              Sign In
            </button>
          </form>
        )}

        {/* ── Register Form ──────────────────────── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  name="first_name" type="text"
                  placeholder="First name"
                  value={form.first_name} onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  name="last_name" type="text"
                  placeholder="Last name"
                  value={form.last_name} onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                name="email" type="email" required
                placeholder="Email address"
                value={form.email} onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                name="password" type={showPassword ? 'text' : 'password'} required
                placeholder="Password (min 8 characters)"
                value={form.password} onChange={handleChange}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                name="confirmPassword" type={showPassword ? 'text' : 'password'} required
                placeholder="Confirm password"
                value={form.confirmPassword} onChange={handleChange}
                className={inputClass}
              />
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              By creating an account you agree to our{' '}
              <Link href="/pages/terms" className="text-brand-gold underline">Terms</Link> and{' '}
              <Link href="/pages/privacy" className="text-brand-gold underline">Privacy Policy</Link>.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-dark text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg disabled:opacity-50"
            >
              Create Account
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-brand-gold transition-colors">
            ← Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
