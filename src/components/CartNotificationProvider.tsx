import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { SlidingCartNotification } from './SlidingCartNotification';

// Create a safe hook that doesn't throw when StoreProvider is missing
const useSafeStore = () => {
  try {
    const { useStore } = require("@/contexts/StoreContext");
    return useStore();
  } catch {
    return { store: null, loading: false, error: null };
  }
};

export function CartNotificationProvider({ children }: { children: React.ReactNode }) {
  const { showCartNotification, hideCartNotification, lastAddedProduct } = useCart();
  const { store } = useSafeStore();

  return (
    <>
      {children}
      {lastAddedProduct && (
        <SlidingCartNotification
          isOpen={showCartNotification}
          onClose={hideCartNotification}
          product={lastAddedProduct}
          quantity={lastAddedProduct.quantity || 1}
          storeSlug={store?.slug}
        />
      )}
    </>
  );
}