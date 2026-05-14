'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/`, {
        credential: credentialResponse.credential
      });
      
      setAuth(res.data.user, res.data.access, res.data.refresh);
      toast.success('Successfully logged in with Google');
      
      if (redirect) {
        router.push(redirect);
      } else if (res.data.user.is_staff) {
        router.push('/admin');
      } else {
        router.push('/account');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-[80px] bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="bg-white max-w-md w-full p-10 rounded-[2.5rem] shadow-xl border border-gray-100 text-center relative overflow-hidden">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <Link href="/" className="inline-block mb-8">
          <img src="/logo.webp" alt="Hara Ceylon" className="h-14 w-auto mx-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </Link>
        
        <h1 className="text-2xl font-serif font-black text-brand-dark mb-2">
          Welcome to Hara
        </h1>
        <p className="text-sm text-gray-500 mb-10 font-medium">
          Securely sign in or create an account using your Google Profile.
        </p>

        <div className="flex justify-center w-full mb-8">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              toast.error('Google Sign-In failed or was cancelled');
            }}
            useOneTap
            shape="pill"
            theme="outline"
            size="large"
            text="continue_with"
            width="300px"
          />
        </div>

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
