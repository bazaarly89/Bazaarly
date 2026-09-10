import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const [items, setItems] = useState(null);
  const { addToCart } = useCart();

  const load = () => Api.getWishlist().then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);

  const remove = async (productId) => { await Api.removeWishlist(productId); load(); };
  const moveToCart = async (productId) => { await addToCart(productId, 1); await remove(productId); };

  if (!items) return <div className="container-app py-20 text-center text-slate-400">Loading wishlist…</div>;

  if (items.length === 0) {
    return (
      <div className="container-app py-24 text-center">
        <h1 className="section-title">Your wishlist is empty</h1>
        <Link to="/products" className="btn-primary mt-6 inline-flex">Discover Products</Link>
      </div>
    );
  }

  return (
    <div className="container-app py-10">
      <h1 className="section-title mb-8">My Wishlist</h1>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <div key={p.id} className="card overflow-hidden">
            <Link to={`/products/${p.slug}`}>
              <img src={p.thumbnail} alt={p.title} className="aspect-square w-full object-cover" />
            </Link>
            <div className="p-4">
              <p className="line-clamp-2 font-medium text-sm">{p.title}</p>
              <p className="mt-1 font-bold">₹{p.price?.toLocaleString()}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => moveToCart(p.id)} className="btn-primary flex-1 py-1.5 text-xs">Move to Cart</button>
                <button onClick={() => remove(p.id)} className="btn-ghost py-1.5 text-xs">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
