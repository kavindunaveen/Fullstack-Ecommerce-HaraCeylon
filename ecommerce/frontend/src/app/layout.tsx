import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import CartHydrator from '@/components/cart/CartHydrator';
import MobileNav from '@/components/layout/MobileNav';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: { default: 'HARA Store — Premium International Brand', template: '%s | HARA Store' },
  description: 'Discover premium products from HARA, a UK-based international brand. Shop worldwide with multi-currency support.',
  keywords: ['HARA', 'premium store', 'UK brand', 'international shipping'],
  openGraph: { type: 'website', locale: 'en_GB', siteName: 'HARA Store' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <CartHydrator />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
          <MobileNav />
          <Toaster position="bottom-right" toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' } }} />
        </Providers>
      </body>
    </html>
  );
}
