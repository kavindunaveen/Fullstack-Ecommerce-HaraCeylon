'use client';
import Link from 'next/link';
import { Home, Search, Heart, User, ShoppingBag } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/store';

export default function MobileNav() {
  const pathname = usePathname();
  const { cart, toggleCart } = useCartStore();
  const items = cart?.item_count || 0;

  const links = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/products', icon: Search, label: 'Shop' },
    { href: '/account/wishlist', icon: Heart, label: 'Wishlist' },
    { href: '/account', icon: User, label: 'Account' },
  ];

  // Hide the bottom nav on product detail pages (sticky action bar replaces it) and checkout page
  const isProductDetail = pathname.startsWith('/products/') && pathname !== '/products/';
  const isCheckout = pathname.startsWith('/checkout');
  if (isProductDetail || isCheckout) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-[90]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex justify-around items-center px-2 py-3">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-brand-dark' : 'text-gray-400 hover:text-gray-600'}`}>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
            </Link>
          );
        })}
        <button onClick={toggleCart} aria-label="Shopping bag" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors">
          <div className="relative">
            <ShoppingBag size={20} strokeWidth={1.5} />
            {items > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-brand-gold text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {items}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-wide uppercase">Bag</span>
        </button>
      </div>
    </nav>
  );
}
