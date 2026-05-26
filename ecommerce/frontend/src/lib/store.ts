/**
 * HARA Store — Zustand Global State
 * Cart, Auth, Currency, Language stores.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  product: {
    id: string; name: string; slug: string; sku: string;
    price: number; sale_price: number | null; effective_price: number;
    stock_status: string;
    main_image: { image_url: string; alt_text: string } | null;
  };
  quantity: number; unit_price: number; line_total: number;
}

export interface Cart {
  id: string; items: CartItem[]; subtotal: number; item_count: number; currency: string;
}

export interface User {
  id: string; email: string; first_name: string; last_name: string;
  full_name: string; is_staff: boolean;
}

// ── Auth Store ────────────────────────────────────────────────
interface AuthState {
  user: User | null; accessToken: string | null; isAuthenticated: boolean;
  setAuth: (user: User, access: string, refresh: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, accessToken: null, isAuthenticated: false,
      setAuth: (user, access, refresh) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
        }
        set({ user, accessToken: access, isAuthenticated: true });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    { name: 'hara-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);

// ── Cart Store ────────────────────────────────────────────────
interface CartState {
  cart: Cart | null; isCartOpen: boolean;
  setCart: (cart: Cart) => void;
  openCart: () => void; closeCart: () => void; toggleCart: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
  cart: null, isCartOpen: false,
  setCart: (cart) => set({ cart }),
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen })),
}));

// ── Currency Store ────────────────────────────────────────────
interface CurrencyState {
  currency: string; symbol: string; rate: number;
  setCurrency: (code: string, symbol: string, rate: number) => void;
  formatPrice: (basePrice: number) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'USD', symbol: '$', rate: 1,
      setCurrency: (code, symbol, rate) => {
        if (typeof window !== 'undefined') localStorage.setItem('currency', code);
        set({ currency: code, symbol, rate });
      },
      formatPrice: (basePrice) => {
        const { symbol, rate } = get();
        const converted = Math.round(basePrice * rate * 100) / 100;
        return `${symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    }),
    { name: 'hara-currency' }
  )
);

// ── Language Store ────────────────────────────────────────────
interface LanguageState {
  language: string;
  setLanguage: (code: string) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (code) => {
        if (typeof window !== 'undefined') localStorage.setItem('language', code);
        set({ language: code });
      },
    }),
    { name: 'hara-language' }
  )
);

// ── Wishlist Store ────────────────────────────────────────────
interface WishlistState {
  items: string[];
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  hasItem: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (id) => set((s) => ({ items: [...new Set([...s.items, String(id).trim().toLowerCase()])] })),
      removeItem: (id) => set((s) => ({ 
        items: s.items.filter((i: any) => {
          const itemId = String(typeof i === 'string' ? i : (i.product_id || i.id)).trim().toLowerCase();
          return itemId !== String(id).trim().toLowerCase();
        })
      })),
      hasItem: (id) => get().items.some((i: any) => {
        const itemId = String(typeof i === 'string' ? i : (i.product_id || i.id)).trim().toLowerCase();
        return itemId === String(id).trim().toLowerCase();
      }),
    }),
    { name: 'hara-wishlist' }
  )
);
