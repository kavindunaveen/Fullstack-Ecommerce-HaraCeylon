'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useCartStore, useAuthStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { cart, toggleCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search when route changes
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, [pathname]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Close search on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/products?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery('');
  };

  const itemCount = cart?.item_count || 0;
  const isHome = pathname === '/';
  const iconColor = isHome && !scrolled ? 'text-white' : 'text-gray-800';

  return (
    <>
      {/* ── Main Header Bar ──────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'py-3' : 'py-6'} px-4 md:px-8`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between rounded-full px-6 py-3 transition-all duration-500 ${
          scrolled ? 'glass shadow-lg border-white/40' :
          isHome ? 'bg-transparent' : 'glass shadow-sm border-white/20'
        }`}>

          {/* Left Navigation (Desktop) */}
          <div className="hidden md:flex items-center gap-8 flex-1">
            <Link href="/products" className={`text-sm font-medium tracking-wide transition-colors hover:text-brand-gold ${iconColor}`}>
              Shop
            </Link>
            <Link href="/pages/about" className={`text-sm font-medium tracking-wide transition-colors hover:text-brand-gold ${iconColor}`}>
              Our Story
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex-1 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className={`p-2 -ml-2 transition-colors ${iconColor}`}
            >
              <Menu strokeWidth={1.5} size={24} />
            </button>
          </div>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 relative group">
            <h1 className={`font-serif text-2xl md:text-3xl font-bold tracking-wider transition-colors ${isHome && !scrolled ? 'text-white' : 'text-brand-dark'}`}>
              HARA
            </h1>
            <div className="absolute -bottom-1 left-1/2 w-0 h-[2px] bg-brand-gold transition-all duration-300 group-hover:w-full group-hover:-translate-x-1/2" />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-1 sm:gap-3 flex-1">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(v => !v)}
              aria-label="Search"
              className={`p-2 transition-colors hover:text-brand-gold ${iconColor} ${searchOpen ? 'text-brand-gold' : ''}`}
            >
              <Search strokeWidth={1.5} size={20} />
            </button>

            {/* Account */}
            <Link
              href={isAuthenticated ? '/account' : '/account/login'}
              className={`hidden sm:flex p-2 transition-colors hover:text-brand-gold ${iconColor}`}
            >
              <User strokeWidth={1.5} size={20} />
            </Link>

            {/* Cart */}
            <button
              onClick={toggleCart}
              className={`relative flex items-center gap-2 p-2 transition-colors hover:text-brand-gold ${iconColor}`}
            >
              <ShoppingBag strokeWidth={1.5} size={20} />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-brand-gold text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Search Overlay ────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-[98]"
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
            />

            {/* Search Panel — slides down from top */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 right-0 z-[99] bg-white shadow-2xl px-4 pt-24 pb-8 md:px-12"
            >
              <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
                <div className="relative">
                  <Search
                    size={20}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search teas, coffees, products…"
                    className="w-full pl-14 pr-16 py-5 text-lg bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-brand-gold focus:bg-white transition-all font-light text-gray-900 placeholder:text-gray-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 px-1">
                  <p className="text-xs text-gray-400">
                    Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">Enter</kbd> to search &nbsp;·&nbsp;{' '}
                    <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">Esc</kbd> to close
                  </p>
                  <button
                    type="submit"
                    disabled={!searchQuery.trim()}
                    className="text-sm font-bold text-brand-gold disabled:opacity-40 hover:text-brand-dark transition-colors"
                  >
                    Search →
                  </button>
                </div>

                {/* Quick Links */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-400 font-medium mr-1">Popular:</span>
                  {['Black Tea', 'Green Tea', 'Arabica Coffee', 'Ceylon'].map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        router.push(`/products?search=${encodeURIComponent(term)}`);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-brand-gold/10 hover:text-brand-gold text-gray-600 rounded-full transition-colors font-medium"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile Menu Overlay ───────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brand-dark/95 backdrop-blur-xl z-[101]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-white z-[102] flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-gray-100">
                <span className="font-serif text-2xl font-bold text-brand-dark">HARA</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-gray-500 hover:text-brand-dark rounded-full bg-gray-50">
                  <X size={20} />
                </button>
              </div>

              {/* Mobile search */}
              <div className="px-6 pt-5">
                <form onSubmit={(e) => { e.preventDefault(); const q = searchQuery.trim(); if (q) { router.push(`/products?search=${encodeURIComponent(q)}`); setMobileOpen(false); setSearchQuery(''); } }}>
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search products…"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-gold transition-colors"
                    />
                  </div>
                </form>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 mt-2">
                <Link href="/" onClick={() => setMobileOpen(false)} className="text-3xl font-serif text-gray-900 hover:text-brand-gold transition-colors">Home</Link>
                <Link href="/products" onClick={() => setMobileOpen(false)} className="text-3xl font-serif text-gray-900 hover:text-brand-gold transition-colors">Shop</Link>
                <Link href="/pages/about" onClick={() => setMobileOpen(false)} className="text-3xl font-serif text-gray-900 hover:text-brand-gold transition-colors">Our Story</Link>
                <Link href="/pages/contact" onClick={() => setMobileOpen(false)} className="text-3xl font-serif text-gray-900 hover:text-brand-gold transition-colors">Contact</Link>
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <Link href={isAuthenticated ? '/account' : '/account/login'} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-brand-dark font-medium">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <User size={18} />
                  </div>
                  {isAuthenticated ? 'My Account' : 'Sign In / Register'}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
