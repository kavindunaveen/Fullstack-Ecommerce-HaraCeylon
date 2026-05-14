'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Search, ShoppingBag, User, Menu, X, LogOut, Package, Settings, ChevronDown, Loader2, Heart } from 'lucide-react';
import { useCartStore, useAuthStore, useCurrencyStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { cart, toggleCart } = useCartStore();
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const { formatPrice } = useCurrencyStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleLogout = () => {
    clearAuth();
    router.push('/');
    setAccountOpen(false);
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
            <h1 className={`font-serif text-2xl md:text-3xl font-black tracking-tight transition-colors ${isHome && !scrolled ? 'text-white' : 'text-brand-dark'}`}>
              HARA <span className="text-brand-gold italic font-light">CEYLON</span>
            </h1>
            <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-brand-gold transition-all duration-300 group-hover:w-full" />
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

            {/* Account Dropdown */}
            <div className="relative" ref={accountMenuRef}>
              <button
                onMouseEnter={() => !mobileOpen && setAccountOpen(true)}
                onClick={() => setAccountOpen(v => !v)}
                className={`p-2 transition-colors hover:text-brand-gold flex items-center gap-1 ${iconColor} ${accountOpen ? 'text-brand-gold' : ''}`}
              >
                <User strokeWidth={1.5} size={20} />
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
                      className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full text-gray-400"
                    >
                      {searchLoading ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />}
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
              </form>

              {/* Live Results Dropdown */}
              <AnimatePresence mode="wait">
                {searchResults.length > 0 && searchQuery && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="max-w-3xl mx-auto mt-6 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
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
                          <div className="w-12 h-12 bg-gray-50 rounded-lg p-1 border border-gray-100 flex items-center justify-center shrink-0">
                            {p.main_image?.image_url && (
                              <img src={p.main_image.image_url} alt="" className="w-full h-full object-contain" />
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
                <div className="max-w-3xl mx-auto mt-6 flex flex-wrap gap-2">
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
              className="fixed inset-0 bg-brand-dark/95 backdrop-blur-xl z-[101]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-white z-[102] flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-gray-100">
                <div className="flex flex-col">
                  <span className="font-serif text-2xl font-black text-brand-dark leading-none">HARA</span>
                  <span className="text-[10px] font-bold text-brand-gold tracking-[0.4em] uppercase mt-1">Ceylon</span>
                </div>
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
