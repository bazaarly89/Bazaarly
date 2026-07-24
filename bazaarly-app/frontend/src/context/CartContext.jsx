import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Api } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const { items } = await Api.getCart();
      setItems(items);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addToCart = async (productId, quantity = 1) => {
    const { items } = await Api.addToCart(productId, quantity);
    setItems(items);
  };

  const updateQuantity = async (cartItemId, quantity) => {
    const { items } = await Api.updateCartItem(cartItemId, quantity);
    setItems(items);
  };

  const removeItem = async (cartItemId) => {
    const { items } = await Api.removeCartItem(cartItemId);
    setItems(items);
  };

  const clearCart = async () => {
    await Api.clearCart();
    setItems([]);
  };

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const count = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, refresh, addToCart, updateQuantity, removeItem, clearCart, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
