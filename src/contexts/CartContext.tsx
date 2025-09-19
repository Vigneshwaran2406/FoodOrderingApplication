import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number, notes?: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
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

const getUserId = (user: any) => {
  if (!user) return null;
  return user.userId || user._id || user.id || null;
};

const mergeCarts = (a: CartItem[], b: CartItem[]) => {
  const map = new Map<string, CartItem>();
  for (const item of a || []) map.set(item.id, { ...item });
  for (const item of b || []) {
    if (map.has(item.id)) {
      const existing = map.get(item.id)!;
      map.set(item.id, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      map.set(item.id, { ...item });
    }
  }
  return Array.from(map.values());
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { user } = useAuth(); // AuthProvider wraps CartProvider in your app
  const [items, setItems] = useState<CartItem[]>(() => {
    // initial load — prefer guest cart (we'll reconcile on user change)
    try {
      const raw = localStorage.getItem('cart_guest');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const prevUserIdRef = useRef<string | null>(null);

  // Whenever user changes, load/save/merge carts appropriately
  useEffect(() => {
    const userId = getUserId(user);
    const userKey = userId ? `cart_user_${userId}` : 'cart_guest';

    try {
      if (user) {
        // user logged in
        const guestRaw = localStorage.getItem('cart_guest');
        const userRaw = localStorage.getItem(userKey);
        const guestCart: CartItem[] = guestRaw ? JSON.parse(guestRaw) : [];
        const userCart: CartItem[] = userRaw ? JSON.parse(userRaw) : [];

        if (guestCart && guestCart.length > 0) {
          const merged = mergeCarts(userCart, guestCart);
          setItems(merged);
          localStorage.setItem(userKey, JSON.stringify(merged));
          localStorage.removeItem('cart_guest'); // migrate guest cart into user cart
        } else {
          setItems(userCart || []);
        }
      } else {
        // user is null (guest)
        if (prevUserIdRef.current) {
          // this is a logout event: clear items and remove saved user cart if you want
          setItems([]);
          const prevKey = `cart_user_${prevUserIdRef.current}`;
          localStorage.removeItem(prevKey);
        } else {
          // initial guest mount
          const guestRaw = localStorage.getItem('cart_guest');
          setItems(guestRaw ? JSON.parse(guestRaw) : []);
        }
      }
    } catch (err) {
      console.error('Cart load error:', err);
      setItems([]);
    }

    prevUserIdRef.current = userId ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Persist current items to the appropriate storage key
  useEffect(() => {
    try {
      const userId = getUserId(user);
      const key = userId ? `cart_user_${userId}` : 'cart_guest';
      localStorage.setItem(key, JSON.stringify(items));
    } catch (err) {
      console.error('Cart persist error:', err);
    }
  }, [items, user]);

  const addToCart = (product: any, quantity = 1, notes = '') => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product._id);

      if (existingItem) {
        return prevItems.map(item =>
          item.id === product._id
            ? { ...item, quantity: item.quantity + quantity, notes }
            : item
        );
      } else {
        return [...prevItems, {
          id: product._id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image,
          notes
        }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(id);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      const userId = getUserId(user);
      const key = userId ? `cart_user_${userId}` : 'cart_guest';
      localStorage.removeItem(key);
    } catch (err) {
      console.error('Error clearing cart storage', err);
    }
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getTotalItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
