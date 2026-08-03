'use client';
import { useState, Suspense } from 'react';
import { authApi } from '@/lib/api';
import Link from 'next/link';
import { Lock, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error('Invalid or missing reset token.');
    if (!password || !confirmPassword) return toast.error('Please enter your new password.');
    if (password.length < 8) return toast.error('Password must be at least 8 characters.');
    if (password !== confirmPassword) return toast.error('Passwords do not match.');
    
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setSuccess(true);
      toast.success('Password has been reset successfully.');
      setTimeout(() => router.push('/account/login'), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password. The token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-gold focus:bg-white transition-all";

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-brand-dark">Password Reset!</h2>
        <p className="text-sm text-gray-500">
          Your password has been successfully reset. Redirecting you to login...
        </p>
        <Link
          href="/account/login"
          className="inline-block mt-4 text-sm font-bold text-brand-gold hover:text-brand-dark transition-colors"
        >
          Return to Login Now
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center space-y-6">
        <h2 className="text-xl font-bold text-red-500">Invalid Link</h2>
        <p className="text-sm text-gray-500">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/account/forgot-password"
          className="inline-block mt-4 text-sm font-bold text-brand-gold hover:text-brand-dark transition-colors"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type={showPassword ? 'text' : 'password'} required
          placeholder="New Password"
          value={password} onChange={e => setPassword(e.target.value)}
          className={inputClass}
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
          type={showPassword ? 'text' : 'password'} required
          placeholder="Confirm New Password"
          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-brand-dark text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
      >
        Save New Password <ArrowRight size={16} />
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="pt-[80px] bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="bg-white max-w-md w-full p-10 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-black text-brand-dark">Set New Password</h1>
          <p className="text-gray-400 text-sm mt-2 font-light">
            Please enter your new password below.
          </p>
        </div>
        
        <Suspense fallback={<div className="text-center text-gray-400 text-sm py-4">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
