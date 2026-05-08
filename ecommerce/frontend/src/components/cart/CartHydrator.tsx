'use client';
/**
 * CartHydrator — runs once on mount to sync cart state from the backend.
 * Renders nothing. Placed in the root layout so every page benefits.
 *
 * Why needed: Zustand cart store starts as null on every fresh page load.
 * Without this, the cart badge shows 0 and CartDrawer is empty until the
 * user explicitly adds an item — even if they had items from a previous session.
 */
import { useEffect } from 'react';
import { cartApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';

export default function CartHydrator() {
  const setCart = useCartStore((s) => s.setCart);

  useEffect(() => {
    cartApi.get()
      .then((res) => {
        if (res.data) setCart(res.data);
      })
      .catch(() => {
        // Silently fail — guest may not have a session yet
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
