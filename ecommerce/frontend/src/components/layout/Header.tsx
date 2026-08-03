'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Search, ShoppingBag, User, Menu, X, LogOut, Package, Settings, ChevronDown, Loader2, Heart, Globe } from 'lucide-react';
import { useCartStore, useAuthStore, useCurrencyStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';
import { productsApi, authApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import CurrencySelector from './CurrencySelector';

const CURRENCIES = [
  { code: 'GBP', symbol: '£', rate: 1, name: 'British Pound' },
  { code: 'USD', symbol: '$', rate: 1.27, name: 'US Dollar' },
  { code: 'EUR', symbol: '€', rate: 1.17, name: 'Euro' },
  { code: 'AUD', symbol: 'A$', rate: 1.95, name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', rate: 1.72, name: 'Canadian Dollar' },
  { code: 'LKR', symbol: 'Rs', rate: 385, name: 'Sri Lankan Rupee' },
];

export default function Header() {
  const { cart, toggleCart } = useCartStore();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const { currency, setCurrency, formatPrice } = useCurrencyStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mobileCurrencyOpen, setMobileCurrencyOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close everything on route change
  useEffect(() => {
    setSearchOpen(false);
    setMobileOpen(false);
    setAccountOpen(false);
    setSearchQuery('');
  }, [pathname]);

  // Live Search Logic
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await productsApi.list({ search: searchQuery });
        setSearchResults(res.data.results?.slice(0, 5) || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (refresh) {
        await authApi.logout();
      }
    } catch {
      // Even if API call fails, still clear local state
    } finally {
      clearAuth();
      router.push('/');
      setAccountOpen(false);
    }
  };

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
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'py-2 md:py-3' : 'py-4 md:py-6'} px-3 md:px-8`}>
        <div className={`max-w-7xl mx-auto flex items-center justify-between rounded-full px-4 md:px-6 py-2.5 md:py-3 transition-all duration-500 ${
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
              className={`p-2 -ml-1 transition-colors touch-target ${iconColor}`}
              aria-label="Open menu"
            >
              <Menu strokeWidth={1.5} size={22} />
            </button>
          </div>

          <Link href="/" className="flex-shrink-0 relative group">
            <h1 className={`font-serif text-xl md:text-3xl font-black tracking-tight transition-colors ${isHome && !scrolled ? 'text-white' : 'text-brand-dark'}`}>
              HARA <span className="text-brand-gold italic font-light">CEYLON</span>
            </h1>
            <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-brand-gold transition-all duration-300 group-hover:w-full" />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-0.5 sm:gap-2 flex-1">
            {/* Currency Selector (desktop only — hidden on mobile via component) */}
            <CurrencySelector iconColor={iconColor} />

            {/* Search button */}
            <button
              onClick={() => setSearchOpen(v => !v)}
              aria-label="Search"
              className={`touch-target p-1.5 transition-colors hover:text-brand-gold ${iconColor} ${searchOpen ? 'text-brand-gold' : ''}`}
            >
              <Search strokeWidth={1.5} size={19} />
            </button>

            {/* Account Dropdown (desktop) */}
            <div className="relative hidden md:block" ref={accountMenuRef}>
              <button
                onMouseEnter={() => !mobileOpen && setAccountOpen(true)}
                onClick={() => setAccountOpen(v => !v)}
                aria-label="Account menu"
                className={`p-1.5 transition-colors hover:text-brand-gold flex items-center gap-1 ${iconColor} ${accountOpen ? 'text-brand-gold' : ''}`}
              >
                <User strokeWidth={1.5} size={19} />
                {isAuthenticated && user && (
                  <ChevronDown size={12} className={`transition-transform duration-300 ${accountOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 overflow-hidden z-[110]"
                    onMouseLeave={() => setAccountOpen(false)}
                  >
                    {(!isAuthenticated || !user) ? (
                      <div className="p-5 space-y-4">
                        <div className="text-center pb-2">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Welcome</p>
                          <p className="text-sm text-gray-600 font-medium">Log in to your account</p>
                        </div>
                        <Link 
                          href="/account/login" 
                          className="block w-full py-3 bg-brand-dark text-white rounded-xl text-center text-xs font-bold uppercase tracking-widest hover:bg-brand-gold transition-colors"
                        >
                          Sign In
                        </Link>
                        <Link 
                          href="/account/login?signup=true" 
                          className="block w-full py-3 bg-gray-50 text-brand-dark border border-gray-100 rounded-xl text-center text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                        >
                          Create Account
                        </Link>
                      </div>
                    ) : (
                      <div className="p-2">
                        <div className="px-4 py-3 mb-2 border-b border-gray-50">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Logged in as</p>
                          <p className="text-sm font-bold text-brand-dark truncate">{user?.first_name} {user?.last_name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                        </div>
                        
                        <Link href="/account" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors group">
                          <Package size={18} className="text-gray-400 group-hover:text-brand-gold" />
                          <span className="text-sm font-medium">My Orders</span>
                        </Link>
                        
                        <Link href="/account/wishlist" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors group">
                          <Heart size={18} className="text-gray-400 group-hover:text-brand-gold" />
                          <span className="text-sm font-medium">My Wishlist</span>
                        </Link>
                        
                        <Link href="/account/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors group">
                          <User size={18} className="text-gray-400 group-hover:text-brand-gold" />
                          <span className="text-sm font-medium">Profile Settings</span>
                        </Link>

                        {user?.is_staff && (
                          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-gold/5 text-brand-gold transition-colors group">
                            <Settings size={18} className="group-hover:rotate-45 transition-transform" />
                            <span className="text-sm font-bold">Admin Dashboard</span>
                          </Link>
                        )}

                        <div className="mt-2 pt-2 border-t border-gray-50">
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-colors group"
                          >
                            <LogOut size={18} />
                            <span className="text-sm font-bold">Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Account Icon (mobile only — taps to account page) */}
            <div className="flex md:hidden">
              <Link
                href={isAuthenticated ? '/account' : '/account/login'}
                className={`touch-target p-1.5 transition-colors hover:text-brand-gold ${iconColor}`}
                aria-label="Account"
              >
                <User strokeWidth={1.5} size={19} />
              </Link>
            </div>

            {/* Cart */}
            <button
              onClick={toggleCart}
              className={`relative touch-target p-1.5 transition-colors hover:text-brand-gold ${iconColor}`}
              aria-label="Shopping bag"
            >
              <ShoppingBag strokeWidth={1.5} size={19} />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-brand-gold text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

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
              className="fixed top-0 left-0 right-0 z-[99] bg-white shadow-2xl px-4 pt-20 md:pt-24 pb-6 md:pb-8 md:px-12"
            >
              <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search teas, coffees, products…"
                    className="w-full pl-12 pr-14 py-4 md:py-5 text-base md:text-lg bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-brand-gold focus:bg-white transition-all font-light text-gray-900 placeholder:text-gray-400"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full text-gray-400"
                    >
                      {searchLoading ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 px-1">
                  <p className="text-xs text-gray-400 hidden sm:block">
                    Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">Enter</kbd> to search &nbsp;·&nbsp;{' '}
                    <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">Esc</kbd> to close
                  </p>
                  <button
                    type="submit"
                    disabled={!searchQuery.trim()}
                    className="text-sm font-bold text-brand-gold disabled:opacity-40 hover:text-brand-dark transition-colors ml-auto"
                  >
                    Search →
                  </button>
                </div>
              </form>

              {/* Live Results Dropdown */}
              <AnimatePresence mode="wait">
                {searchResults.length > 0 && searchQuery && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="max-w-3xl mx-auto mt-4 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                  >
                    <div className="p-2">
                      <div className="px-4 py-3 border-b border-gray-50 mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Product Suggestions</span>
                        <span className="text-[10px] font-bold text-gray-300">{searchResults.length} results</span>
                      </div>
                      {searchResults.map((p) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.slug}`}
                          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                          className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-gray-50 rounded-lg p-1 border border-gray-100 flex items-center justify-center shrink-0">
                            {p.main_image?.image_url && (
                              <Image src={p.main_image.image_url} alt="" width={40} height={40} className="w-full h-full object-contain" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 group-hover:text-brand-gold transition-colors truncate">{p.name}</p>
                            <p className="text-xs text-gray-400 font-medium">{p.category_name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black text-brand-dark">{formatPrice(Number(p.effective_price))}</p>
                          </div>
                        </Link>
                      ))}
                      <button 
                        onClick={handleSearch}
                        className="w-full text-center py-3 text-xs font-bold text-gray-400 hover:text-brand-gold transition-colors uppercase tracking-widest mt-1"
                      >
                        View all results
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Links */}
              {(!searchQuery || searchResults.length === 0) && (
                <div className="max-w-3xl mx-auto mt-4 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-400 font-medium mr-1 py-1.5">Popular:</span>
                  {['Black Tea', 'Green Tea', 'Arabica Coffee', 'Ceylon'].map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        router.push(`/products?search=${encodeURIComponent(term)}`);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="text-xs px-3 py-1.5 bg-gray-50 hover:bg-brand-gold/10 hover:text-brand-gold text-gray-600 rounded-full transition-colors font-medium border border-gray-100"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
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
              className="fixed inset-0 bg-brand-dark/70 backdrop-blur-md z-[101]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[340px] bg-white z-[102] flex flex-col shadow-2xl"
            >
              {/* Mobile Menu Header */}
              <div className="p-5 flex items-center justify-between border-b border-gray-100 safe-top">
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex flex-col leading-none">
                  <span className="font-serif text-2xl font-black text-brand-dark">HARA</span>
                  <span className="text-[10px] font-bold text-brand-gold tracking-[0.4em] uppercase mt-0.5">Ceylon</span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="touch-target p-2 text-gray-500 hover:text-brand-dark rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-50">
                <form onSubmit={(e) => { e.preventDefault(); const q = searchQuery.trim(); if (q) { router.push(`/products?search=${encodeURIComponent(q)}`); setMobileOpen(false); setSearchQuery(''); } }}>
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto">
                <nav className="p-5 flex flex-col gap-1">
                  {[
                    { href: '/', label: 'Home' },
                    { href: '/products', label: 'Shop' },
                    { href: '/pages/about', label: 'Our Story' },
                    { href: '/pages/contact', label: 'Contact' },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-gray-800 hover:bg-gray-50 hover:text-brand-gold transition-all group"
                    >
                      <span className="font-serif text-2xl font-medium">{label}</span>
                      <ChevronDown size={16} className="-rotate-90 text-gray-300 group-hover:text-brand-gold transition-colors" />
                    </Link>
                  ))}
                </nav>

                {/* Currency Picker in Mobile Menu */}
                <div className="mx-5 mb-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <button
                    onClick={() => setMobileCurrencyOpen(v => !v)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe size={16} className="text-brand-gold" />
                      <span className="text-sm font-bold text-gray-700">Currency</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-brand-gold">{currency}</span>
                      <ChevronDown size={14} className={`text-gray-400 transition-transform ${mobileCurrencyOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {mobileCurrencyOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2">
                          {CURRENCIES.map((c) => (
                            <button
                              key={c.code}
                              onClick={() => { setCurrency(c.code, c.symbol, c.rate); setMobileCurrencyOpen(false); }}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                currency === c.code
                                  ? 'bg-brand-gold text-white font-bold shadow-sm'
                                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-gold/50'
                              }`}
                            >
                              <span className="font-bold">{c.symbol}</span>
                              <span>{c.code}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Mobile Menu Footer — Account */}
              <div className="p-5 border-t border-gray-100 bg-gray-50 safe-bottom">
                {isAuthenticated && user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="w-9 h-9 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                        <User size={16} className="text-brand-gold" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-dark truncate">{user.first_name} {user.last_name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-700 border border-gray-100">
                      <Package size={16} className="text-gray-400" />
                      <span className="text-sm font-medium">My Orders</span>
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-500">
                      <LogOut size={16} />
                      <span className="text-sm font-bold">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/account/login" onClick={() => setMobileOpen(false)} className="w-full py-3.5 bg-brand-dark text-white rounded-xl text-center text-sm font-bold uppercase tracking-wider hover:bg-brand-gold transition-colors">
                      Sign In
                    </Link>
                    <Link href="/account/login?signup=true" onClick={() => setMobileOpen(false)} className="w-full py-3.5 bg-white text-brand-dark border border-gray-200 rounded-xl text-center text-sm font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors">
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
