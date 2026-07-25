import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
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
  const [isWished, setIsWished] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  const load = () => Api.product(slug).then(setData);
  useEffect(() => { load(); window.scrollTo(0, 0); }, [slug]);

  // Check whether this product is already in the signed-in user's wishlist
  useEffect(() => {
    if (!user || !data) return;
    Api.getWishlist()
      .then(({ items }) => setIsWished(items.some((p) => p.id === data.product.id)))
      .catch(() => {});
  }, [user, data]);

  const toggleWishlist = async () => {
    if (!user) return navigate('/login');
    if (isWished) {
      await Api.removeWishlist(data.product.id);
      setIsWished(false);
    } else {
      await Api.addWishlist(data.product.id);
      setIsWished(true);
    }
  };

  const shareProduct = async () => {
    const shareData = { title: data.product.title, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setShareMsg('Link copied!');
      setTimeout(() => setShareMsg(''), 2000);
    }
  };

  if (!data) {
    return (
      <div className="container-app py-24 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="mt-4 text-sm text-slate-400">Loading product…</p>
      </div>
    );
  }

  const { product, attributes, reviews } = data;
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const inStock = product.stock > 0;

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
    <div className="container-app pb-28 pt-8 lg:pb-14">
      {/* Breadcrumb */}
      <p className="mb-6 truncate text-sm text-slate-400">
        <span className="hover:text-brand-600">Home</span>
        <span className="mx-2">/</span>
        <span className="text-slate-500">{product.brand}</span>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{product.title}</span>
      </p>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Gallery — sticks in place while the right column scrolls */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ImageZoom images={product.images} />
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">{product.brand}</p>
            <div className="flex shrink-0 items-center gap-2">
              {shareMsg && <span className="text-xs font-medium text-green-600">{shareMsg}</span>}
              <button
                onClick={toggleWishlist}
                aria-label="Save to wishlist"
                className={`rounded-full border p-2.5 transition ${isWished ? 'border-accent-400 bg-accent-50 text-accent-500' : 'border-slate-200 text-slate-500 hover:border-accent-400 hover:text-accent-500'}`}
              >
                <Heart size={18} fill={isWished ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={shareProduct}
                aria-label="Share product"
                className="rounded-full border border-slate-200 p-2.5 text-slate-500 transition hover:border-brand-400 hover:text-brand-600"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-[2.25rem]">
            {product.title}
          </h1>

          <a href="#reviews" className="mt-3 inline-block">
            <StarRating value={product.rating} count={product.rating_count} showValue />
          </a>

          {/* Price block */}
          <div className="mt-6 rounded-xl2 bg-slate-50 p-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-slate-900">₹{product.price?.toLocaleString()}</span>
              {product.mrp > product.price && (
                <>
                  <span className="text-lg text-slate-400 line-through">₹{product.mrp?.toLocaleString()}</span>
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-sm font-semibold text-green-700">{discount}% off</span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Inclusive of all taxes</p>
          </div>

          <div>
            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Description</h2>
            <div
              className="prose-content mt-2 leading-relaxed text-slate-600 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-3 [&_p:first-child]:mt-0 [&_strong]:font-semibold [&_strong]:text-slate-800 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          {attributes?.length > 0 && (
            <div>
              <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Specifications</h2>
              <dl className="mt-2 divide-y divide-slate-100 rounded-xl2 border border-slate-100">
                {attributes.map((a, i) => (
                  <div key={i} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-slate-500">{a.attr_key}</dt>
                    <dd className="text-right font-medium text-slate-800">{a.attr_value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 text-sm font-semibold">
            <span className={`h-2 w-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={inStock ? 'text-green-700' : 'text-red-500'}>
              {inStock ? `In Stock — ${product.stock} available` : 'Out of Stock'}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500">Quantity</span>
            <div className="flex items-center rounded-full border border-slate-200">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 py-2 text-lg text-slate-600 hover:text-brand-600">−</button>
              <span className="w-8 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="w-10 py-2 text-lg text-slate-600 hover:text-brand-600">+</button>
            </div>
          </div>

          {/* Desktop actions (mobile uses the sticky bar below) */}
          <div className="mt-8 hidden gap-4 lg:flex">
            <button onClick={handleAddToCart} disabled={!inStock} className="btn-outline flex-1">Add to Cart</button>
            <button onClick={handleBuyNow} disabled={!inStock} className="btn-accent flex-1">Buy Now</button>
          </div>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-100 pt-6 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <Truck size={20} className="text-brand-500" />
              <p className="text-xs font-medium text-slate-500">Fast Delivery</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <RotateCcw size={20} className="text-brand-500" />
              <p className="text-xs font-medium text-slate-500">Easy Returns</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck size={20} className="text-brand-500" />
              <p className="text-xs font-medium text-slate-500">Secure Payment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div id="reviews" className="mt-20 grid gap-10 border-t border-slate-100 pt-14 lg:grid-cols-2">
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

      {/* Sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-slate-100 bg-white/95 p-3 backdrop-blur lg:hidden">
        <button onClick={handleAddToCart} disabled={!inStock} className="btn-outline flex-1">Add to Cart</button>
        <button onClick={handleBuyNow} disabled={!inStock} className="btn-accent flex-1">Buy Now</button>
      </div>
    </div>
  );
}
