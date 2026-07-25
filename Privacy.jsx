import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import StarRating from '../components/StarRating';
import ImageZoom from '../components/ImageZoom';

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [data, setData] = useState(null);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => Api.product(slug).then(setData);
  useEffect(() => { load(); }, [slug]);

  if (!data) return <div className="container-app py-20 text-center text-slate-400">Loading product…</div>;
  const { product, attributes, reviews } = data;
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    await addToCart(product.id, qty);
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/login');
    await addToCart(product.id, qty);
    navigate('/checkout');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setSubmitting(true);
    try {
      await Api.addReview({ productId: product.id, ...reviewForm });
      setReviewForm({ rating: 5, title: '', comment: '' });
      load();
    } finally { setSubmitting(false); }
  };

  return (
    <div className="container-app py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <ImageZoom images={product.images} />

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">{product.brand}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900">{product.title}</h1>
          <div className="mt-3"><StarRating value={product.rating} count={product.rating_count} showValue /></div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">₹{product.price?.toLocaleString()}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-lg text-slate-400 line-through">₹{product.mrp?.toLocaleString()}</span>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-sm font-semibold text-green-700">{discount}% off</span>
              </>
            )}
          </div>

          <p className="mt-5 text-slate-600 leading-relaxed">{product.description}</p>

          {attributes?.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              {attributes.map((a, i) => (
                <div key={i}><span className="font-semibold text-slate-700">{a.attr_key}: </span><span className="text-slate-500">{a.attr_value}</span></div>
              ))}
            </div>
          )}

          <p className={`mt-5 text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-slate-200">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2 text-lg">−</button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-4 py-2 text-lg">+</button>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button onClick={handleAddToCart} disabled={product.stock === 0} className="btn-outline flex-1">Add to Cart</button>
            <button onClick={handleBuyNow} disabled={product.stock === 0} className="btn-accent flex-1">Buy Now</button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="section-title mb-6">Customer Reviews</h2>
          {reviews?.length === 0 && <p className="text-slate-400">No reviews yet. Be the first to review this product!</p>}
          <div className="space-y-5">
            {reviews?.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{r.user_name}</p>
                  <StarRating value={r.rating} />
                </div>
                {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                <p className="mt-1 text-sm text-slate-600">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="section-title mb-6">Write a Review</h2>
          <form onSubmit={submitReview} className="card space-y-4 p-6">
            <div>
              <label className="label">Your Rating</label>
              <input type="range" min="1" max="5" value={reviewForm.rating}
                onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))} className="w-full" />
              <StarRating value={reviewForm.rating} showValue />
            </div>
            <div>
              <label className="label">Title</label>
              <input className="input" value={reviewForm.title} onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))} placeholder="Great product!" />
            </div>
            <div>
              <label className="label">Your Review</label>
              <textarea className="input" rows={4} value={reviewForm.comment} onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Tell us what you think..." />
            </div>
            <button className="btn-primary w-full" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Review'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
