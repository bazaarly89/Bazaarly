import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Api } from '../api/client';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [wished, setWished] = useState(false);
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) return (window.location.href = '/login');
    setBusy(true);
    try { await addToCart(product.id, 1); } finally { setBusy(false); }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) return (window.location.href = '/login');
    setWished((w) => !w);
    try { wished ? await Api.removeWishlist(product.id) : await Api.addWishlist(product.id); } catch {}
  };

  return (
    <Link to={`/products/${product.slug}`} className="card group relative overflow-hidden animate-fadeUp">
      <div className="relative aspect-square overflow-hidden rounded-t-xl2 bg-slate-100">
        <img
          src={product.thumbnail || product.images?.[0]}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-accent-500 px-2.5 py-1 text-xs font-bold text-white shadow">
            -{discount}%
          </span>
        )}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow hover:scale-110 transition"
          aria-label="Add to wishlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wished ? '#ff6b35' : 'none'} stroke={wished ? '#ff6b35' : '#64748b'} strokeWidth="2">
            <path d="M12 21s-7.5-4.6-10-9.1C.6 8.4 2 4.5 5.6 3.7 8 3.2 10 4.3 12 6.8c2-2.5 4-3.6 6.4-3.1 3.6.8 5 4.7 3.6 8.2C19.5 16.4 12 21 12 21z" />
          </svg>
        </button>
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-white/95 backdrop-blur px-3 py-2 transition-transform duration-300 group-hover:translate-y-0">
          <button onClick={handleAdd} disabled={busy} className="btn-primary w-full text-sm py-2">
            {busy ? 'Adding…' : 'Add to Cart'}
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{product.brand}</p>
        <h3 className="mt-1 line-clamp-2 font-medium text-slate-800">{product.title}</h3>
        <div className="mt-1.5"><StarRating value={product.rating} count={product.rating_count} showValue size={14} /></div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">₹{product.price?.toLocaleString()}</span>
          {product.mrp > product.price && (
            <span className="text-sm text-slate-400 line-through">₹{product.mrp?.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
