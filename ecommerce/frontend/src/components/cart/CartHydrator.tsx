'use client';
/**
 * CartHydrator — runs once on mount to sync cart state from the backend.
 * Renders nothing. Placed in the root layout so every page benefits.
 *
 * Why needed: Zustand cart store starts as null on every fresh page load.
 * Without this, the cart badge shows 0 and CartDrawer is empty until the
 * user explicitly adds an item — even if they had items from a previous session.
 *
 * Performance: Uses a 30-second stale-time check to avoid firing an API call
 * on every page navigation. The cart is re-fetched at most once every 30 seconds.
 */
import { useEffect } from 'react';
import { cartApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';

const CART_STALE_TIME_MS = 30_000; // 30 seconds
const CART_LAST_FETCHED_KEY = 'hara-cart-last-fetched';

export default function CartHydrator() {
  const setCart = useCartStore((s) => s.setCart);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if we've fetched the cart recently — avoid per-navigation API calls
    const lastFetched = parseInt(localStorage.getItem(CART_LAST_FETCHED_KEY) || '0', 10);
    const now = Date.now();
    const isStale = now - lastFetched > CART_STALE_TIME_MS;

    if (!isStale) return; // Cart is fresh — skip the fetch

    cartApi.get()
      .then((res) => {
        if (res.data) {
          setCart(res.data);
          localStorage.setItem(CART_LAST_FETCHED_KEY, String(Date.now()));
        }
      })
      .catch(() => {
        // Silently fail — guest may not have a session yet
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
