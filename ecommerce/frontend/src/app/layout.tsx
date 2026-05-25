import type { Metadata } from 'next';
import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import { Providers } from '@/components/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import CartHydrator from '@/components/cart/CartHydrator';
import MobileNav from '@/components/layout/MobileNav';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: { default: 'HARA Ceylon — Premium Tea & Coffee from Sri Lanka', template: '%s | HARA Ceylon' },
  description: 'Discover premium organic teas and coffees from the highlands of Sri Lanka. Single-origin, 100% natural, shipped worldwide.',
  keywords: ['HARA Ceylon', 'Ceylon tea', 'Sri Lanka coffee', 'organic tea', 'premium coffee', 'international shipping'],
  openGraph: { type: 'website', locale: 'en_GB', siteName: 'HARA Ceylon' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
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
