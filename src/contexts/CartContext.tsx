import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CartItem, MenuItem } from '@/types';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isItemInCart: (itemId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = useCallback((item: MenuItem, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      
      if (existingItem) {
        // Check stock
        if (existingItem.quantity + quantity > item.stock) {
          toast.error(`Only ${item.stock} items available`);
          return prevItems;
        }
        
        toast.success(`Updated ${item.name} quantity`);
        
        return prevItems.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      
      toast.success(`${item.name} added to your cart`);
      
      return [...prevItems, { ...item, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setItems((prevItems) => {
      const item = prevItems.find((i) => i.id === itemId);
      if (item) {
        toast.info(`${item.name} removed from your cart`);
      }
      return prevItems.filter((i) => i.id !== itemId);
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          // Check stock
          if (quantity > item.stock) {
            toast.error(`Only ${item.stock} items available`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    toast.info('All items removed from your cart');
  }, []);

  const isItemInCart = useCallback((itemId: string) => {
    return items.some((i) => i.id === itemId);
  }, [items]);

  const value: CartContextType = {
    items,
    total,
    itemCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isItemInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
