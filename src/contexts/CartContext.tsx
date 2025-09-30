import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';
import { useStore } from './StoreContext';
import { toast } from '@/hooks/use-toast';

// Track cart events for email marketing
const trackCartEvent = async (eventType: string, organizationId: string, userId?: string, eventData?: any) => {
  try {
    await supabase.functions.invoke('track-events', {
      body: {
        organizationId,
        userId,
        sessionId: crypto.randomUUID(), // Generate session ID for anonymous users
        eventType,
        eventData
      }
    });
  } catch (error) {
    console.error('Failed to track cart event:', error);
  }
};

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    sku?: string;
  };
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  // Guest cart support
  guestItems: CartItem[];
  addGuestItem: (product: any, quantity?: number) => void;
  showCartNotification: boolean;
  hideCartNotification: () => void;
  lastAddedProduct: any;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [guestItems, setGuestItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showCartNotification, setShowCartNotification] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<any>(null);
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { store } = useStore();
  
  // Use store context if available (storefront), otherwise fall back to currentOrganization (admin)
  const organizationId = store?.id || currentOrganization?.id;

  const allItems = user ? items : guestItems;
  const itemCount = allItems.reduce((total, item) => total + item.quantity, 0);
  const total = allItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  // Load guest cart from localStorage on mount
  useEffect(() => {
    const savedGuestCart = localStorage.getItem('guestCart');
    if (savedGuestCart) {
      try {
        setGuestItems(JSON.parse(savedGuestCart));
      } catch (error) {
        console.error('Error parsing guest cart:', error);
      }
    }
  }, []);

  // Fetch cart items when user or organization changes
  useEffect(() => {
    if (user && organizationId) {
      fetchCartItems();
      // Merge guest cart when user logs in
      mergeGuestCart();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user, organizationId]);

  const fetchCartItems = async () => {
    if (!user || !organizationId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopping_cart')
        .select(`
          id,
          product_id,
          quantity,
          products!inner (
            id,
            name,
            price,
            sku,
            product_images!left (
              image_url,
              is_primary
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('organization_id', organizationId);

      if (error) throw error;

      const cartItems: CartItem[] = data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: {
          id: item.products.id,
          name: item.products.name,
          price: Number(item.products.price),
          sku: item.products.sku,
          image_url: item.products.product_images?.find(img => img.is_primary)?.image_url || 
                    item.products.product_images?.[0]?.image_url
        }
      })) || [];

      setItems(cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addGuestItem = (product: any, quantity = 1) => {
    const existingItemIndex = guestItems.findIndex(item => item.product_id === product.id);
    let updatedItems;
    
    if (existingItemIndex >= 0) {
      updatedItems = guestItems.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      const newItem: CartItem = {
        id: `guest-${Date.now()}`,
        product_id: product.id,
        quantity,
        product: {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          sku: product.sku,
          image_url: product.image_url
        }
      };
      updatedItems = [...guestItems, newItem];
    }
    
    setGuestItems(updatedItems);
    localStorage.setItem('guestCart', JSON.stringify(updatedItems));
    
    // Show cart notification
    setLastAddedProduct({ ...product, quantity });
    setShowCartNotification(true);
  };

  const mergeGuestCart = async () => {
    if (!user || !organizationId || guestItems.length === 0) return;
    
    // Add guest items to authenticated cart
    for (const guestItem of guestItems) {
      try {
        await supabase
          .from('shopping_cart')
          .insert({
            user_id: user.id,
            product_id: guestItem.product_id,
            quantity: guestItem.quantity,
            organization_id: organizationId
          });
      } catch (error) {
        console.error('Error merging guest cart item:', error);
      }
    }
    
    // Clear guest cart
    setGuestItems([]);
    localStorage.removeItem('guestCart');
    
    // Refresh cart
    fetchCartItems();
  };

  const addItem = async (productId: string, quantity = 1) => {
    console.log('🛒 CartContext.addItem called', { productId, quantity, organizationId, hasUser: !!user });
    
    if (!user || !organizationId) {
      console.log('📦 Adding to guest cart (no user or org)');
      // Fetch product details for guest cart
      try {
        const { data: product, error } = await supabase
          .from('products')
          .select(`
            id, name, price, sku,
            product_images!left (image_url, is_primary)
          `)
          .eq('id', productId)
          .single();
          
        if (error) throw error;
        
        const productWithImage = {
          ...product,
          image_url: product.product_images?.find(img => img.is_primary)?.image_url || 
                    product.product_images?.[0]?.image_url
        };
        
        addGuestItem(productWithImage, quantity);
        console.log('✅ Added to guest cart');
        return;
      } catch (error) {
        console.error('❌ Error adding to guest cart:', error);
        toast({
          title: "Error",
          description: "Failed to add item to cart",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      console.log('🔍 Checking for existing item...');
      // Check if item already exists in cart
      const existingItem = items.find(item => item.product_id === productId);
      
      if (existingItem) {
        console.log('📝 Item exists, updating quantity');
        // Update quantity
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        console.log('➕ Adding new item to cart');
        // Add new item
        const { error } = await supabase
          .from('shopping_cart')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
            organization_id: organizationId
          });

        if (error) throw error;
        
        await fetchCartItems();
        
        // Get product details for notification
        const { data: product } = await supabase
          .from('products')
          .select(`
            id, name, price, sku,
            product_images!left (image_url, is_primary)
          `)
          .eq('id', productId)
          .single();
          
        if (product) {
          const productWithImage = {
            ...product,
            image_url: product.product_images?.find(img => img.is_primary)?.image_url || 
                      product.product_images?.[0]?.image_url
          };
          setLastAddedProduct({ ...productWithImage, quantity });
          setShowCartNotification(true);
        }

        // Track cart event for email marketing
        trackCartEvent('cart_add', organizationId, user.id, {
          product_id: productId,
          quantity
        });
        
        console.log('✅ Item added successfully');
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('shopping_cart')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
      
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      // Get item details before deletion for tracking
      const item = items.find(i => i.id === itemId);
      
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart"
      });

      // Track cart removal event
      if (item && organizationId) {
        trackCartEvent('cart_remove', organizationId, user?.id, {
          product_id: item.product_id,
          quantity: item.quantity,
          product_name: item.product?.name
        });
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user || !organizationId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', user.id)
        .eq('organization_id', organizationId);

      if (error) throw error;
      
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const hideCartNotification = () => setShowCartNotification(false);

  const value = {
    items: allItems,
    itemCount,
    total,
    loading,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    isOpen,
    openCart,
    closeCart,
    guestItems,
    addGuestItem,
    showCartNotification,
    hideCartNotification,
    lastAddedProduct
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};