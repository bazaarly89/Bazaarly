import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem, loading } = useCart();
  const navigate = useNavigate();

  if (loading) return <div className="container-app py-20 text-center text-slate-400">Loading cart…</div>;

  if (items.length === 0) {
    return (
      <div className="container-app py-24 text-center">
        <h1 className="section-title">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn-primary mt-6 inline-flex">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <h1 className="section-title mb-8">Shopping Cart</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.cart_item_id} className="card flex gap-4 p-4">
              <img src={item.thumbnail} alt={item.title} className="h-24 w-24 rounded-xl object-cover" />
              <div className="flex-1">
                <Link to={`/products/${item.slug}`} className="font-semibold hover:text-brand-600">{item.title}</Link>
                <p className="mt-1 text-sm text-slate-500">₹{item.price?.toLocaleString()}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-slate-200">
                    <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)} className="px-3 py-1">−</button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)} className="px-3 py-1">+</button>
                  </div>
                  <button onClick={() => removeItem(item.cart_item_id)} className="text-sm text-red-500 hover:underline">Remove</button>
                </div>
              </div>
              <p className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="card h-fit p-6">
          <h2 className="mb-4 font-semibold text-lg">Order Summary</h2>
          <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
          <p className="mt-1 text-xs text-slate-400">Shipping & discounts calculated at checkout.</p>
          <button onClick={() => navigate('/checkout')} className="btn-primary mt-6 w-full">Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
}
