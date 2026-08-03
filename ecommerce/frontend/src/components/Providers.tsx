'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { useAuthStore, useWishlistStore } from '@/lib/store';

export function Providers({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const syncWithBackend = useWishlistStore(state => state.syncWithBackend);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      syncWithBackend();
    }
  }, [mounted, isAuthenticated, syncWithBackend]);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
  }));
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder_client_id'}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
