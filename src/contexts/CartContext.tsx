import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  // Fetch cart items when user or organization changes
  useEffect(() => {
    if (user && currentOrganization) {
      fetchCartItems();
    } else {
      setItems([]);
    }
  }, [user, currentOrganization]);

  const fetchCartItems = async () => {
    if (!user || !currentOrganization) return;
    
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
        .eq('organization_id', currentOrganization.id);

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

  const addItem = async (productId: string, quantity = 1) => {
    if (!user || !currentOrganization) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Check if item already exists in cart
      const existingItem = items.find(item => item.product_id === productId);
      
      if (existingItem) {
        // Update quantity
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        // Add new item
        const { error } = await supabase
          .from('shopping_cart')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
            organization_id: currentOrganization.id
          });

        if (error) throw error;
        
        await fetchCartItems();
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart"
        });

        // Track cart event for email marketing
        trackCartEvent('cart_add', currentOrganization.id, user.id, {
          product_id: productId,
          quantity
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
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
      if (item && currentOrganization) {
        trackCartEvent('cart_remove', currentOrganization.id, user?.id, {
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
    if (!user || !currentOrganization) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id);

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

  const value = {
    items,
    itemCount,
    total,
    loading,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    isOpen,
    openCart,
    closeCart
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