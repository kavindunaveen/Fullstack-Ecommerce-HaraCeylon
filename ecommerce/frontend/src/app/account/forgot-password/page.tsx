'use client';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address.');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSuccess(true);
      toast.success('Reset link sent if the email exists.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-gold focus:bg-white transition-all";

  return (
    <div className="pt-[80px] bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="bg-white max-w-md w-full p-10 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-black text-brand-dark">Forgot Password</h1>
          <p className="text-gray-400 text-sm mt-2 font-light">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-brand-dark">Check your inbox</h2>
            <p className="text-sm text-gray-500">
              If an account exists with <span className="font-bold text-gray-700">{email}</span>, we've sent instructions to reset your password.
            </p>
            <Link
              href="/account/login"
              className="inline-block mt-4 text-sm font-bold text-brand-gold hover:text-brand-dark transition-colors"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="email" required
                placeholder="Email address"
                value={email} onChange={e => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-dark text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Send Reset Link <ArrowRight size={16} />
            </button>

            <div className="text-center mt-6 pt-6 border-t border-gray-100">
              <Link href="/account/login" className="text-xs font-bold text-gray-500 hover:text-brand-dark transition-colors">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
