'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { accountApi } from '@/lib/api';
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/auth/verify/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Account verified successfully!');
          // Redirect to login after a few seconds
          setTimeout(() => {
            router.push('/account/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The token may be invalid or expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('A network error occurred. Please try again.');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      {status === 'loading' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="spinner w-12 h-12 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin mb-6" />
          <h1 className="text-2xl font-serif text-brand-dark mb-2">Verifying your email</h1>
          <p className="text-gray-500">Please wait while we confirm your account...</p>
        </motion.div>
      )}

      {status === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <CheckCircle2 size={64} className="text-green-500 mb-6" />
          <h1 className="text-3xl font-serif text-brand-dark mb-4">Email Verified!</h1>
          <p className="text-gray-600 mb-8">{message}</p>
          <p className="text-sm text-gray-500 mb-8">Redirecting to login...</p>
          <Link href="/account/login" className="px-8 py-3 bg-brand-dark text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-black transition-colors">
            Login Now
          </Link>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <XCircle size={64} className="text-red-500 mb-6" />
          <h1 className="text-3xl font-serif text-brand-dark mb-4">Verification Failed</h1>
          <p className="text-gray-600 mb-8">{message}</p>
          <Link href="/account/login" className="px-8 py-3 border-2 border-brand-dark text-brand-dark rounded-full font-bold uppercase tracking-widest text-sm hover:bg-brand-dark hover:text-white transition-all">
            Return to Login
          </Link>
        </motion.div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="bg-brand-sand/30 py-20 min-h-screen">
      <Suspense fallback={<div className="text-center py-20 text-gray-500">Loading...</div>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
