import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [subtotal, setSubtotal] = useState('0.00');
  const [shipping, setShipping] = useState('0.00');
  const [grandTotal, setGrandTotal] = useState('0.00');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    try {
      const res = await api.getCart();
      setCartItems(Array.isArray(res?.items) ? res.items : []);
      setCartCount(Number(res?.count) || 0);
      setSubtotal(res?.subtotal || '0.00');
      setShipping(res?.shipping || '0.00');
      setGrandTotal(res?.grand_total || '0.00');
    } catch (e) {
      console.error('Error fetching cart:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCartItems([]);
      setCartCount(0);
      setSubtotal('0.00');
      setShipping('0.00');
      setGrandTotal('0.00');
    }
  }, [isAuthenticated]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      return { authRequired: true };
    }
    setLoading(true);
    try {
      const res = await api.addToCart(productId, quantity);
      await refreshCart();
      setIsCartOpen(true);
      return { success: true, message: res.message };
    } catch (e) {
      if (e.status === 401) {
        return { authRequired: true };
      }
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, delta) => {
    try {
      await api.updateCartQuantity(itemId, delta);
      await refreshCart();
    } catch (e) {
      console.error('Error updating quantity:', e);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await api.removeFromCart(itemId);
      await refreshCart();
    } catch (e) {
      console.error('Error removing item:', e);
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      await refreshCart();
    } catch (e) {
      console.error('Error clearing cart:', e);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        shipping,
        grandTotal,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
