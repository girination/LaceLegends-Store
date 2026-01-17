import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

// Cart Item interface
interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  image_data?: string;
  quantity: number;
}

// Product interface
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  image_data?: string;
  category: string;
  stock?: number;
  created_at?: string;
}

// Order interface
interface Order {
  id: string;
  buyer_name: string;
  email: string;
  address: string;
  total_price: number;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface AppContextType {
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
  
  // Auth
  isAdmin: boolean;
  isAuthLoading: boolean;
  adminLogin: (email: string) => void;
  adminLogout: () => void;
  
  // UI
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const defaultAppContext: AppContextType = {
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getCartCount: () => 0,
  getSubtotal: () => 0,
  getTotal: () => 0,
  isAdmin: false,
  isAuthLoading: true,
  adminLogin: () => {},
  adminLogout: () => {},
  sidebarOpen: false,
  toggleSidebar: () => {},
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('luxe_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
    setIsCartLoaded(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem('luxe_cart', JSON.stringify(cart));
    }
  }, [cart, isCartLoaded]);

  // Load admin session
  useEffect(() => {
    const adminSession = localStorage.getItem('luxe_admin');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        if (session.expiry > Date.now()) {
          setIsAdmin(true);
        } else {
          localStorage.removeItem('luxe_admin');
        }
      } catch (e) {
        localStorage.removeItem('luxe_admin');
      }
    }
    setIsAuthLoading(false);
  }, []);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Cart functions
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        image_data: product.image_data,
        quantity,
      }];
    });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const getCartCount = () => cart.reduce((total, item) => total + item.quantity, 0);

  const getSubtotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const getTotal = () => {
    const subtotal = getSubtotal();
    const tax = subtotal * 0.08;
    return subtotal + tax;
  };

  // Auth functions
  const adminLogin = (email: string) => {
    const session = {
      email,
      expiry: Date.now() + 24 * 60 * 60 * 1000,
    };
    localStorage.setItem('luxe_admin', JSON.stringify(session));
    setIsAdmin(true);
  };

  const adminLogout = () => {
    localStorage.removeItem('luxe_admin');
    setIsAdmin(false);
  };

  return (
    <AppContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
        getSubtotal,
        getTotal,
        isAdmin,
        isAuthLoading,
        adminLogin,
        adminLogout,
        sidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export type { CartItem, Product, Order, OrderItem };
