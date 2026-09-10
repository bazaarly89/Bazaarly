import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Api } from "../api/client";

const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const offPercent = (price, mrp) => {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100) + "% OFF";
};

export default function SearchResults() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") || "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setLoading(true);
    Api.products({ search: q, limit: 24 })
      .then((r) => setProducts(r.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const addToCart = async (p) => {
    try {
      await Api.addToCart(p.id, 1);
      showToast(p.title + " added to cart");
    } catch (e) {
      showToast(e.message || "Please sign in to add to cart");
    }
  };

  return (
    <div className="container-app py-8">
      <h1 className="text-xl font-display font-bold mb-1">
        Search results for "{q}"
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {loading ? "Searching…" : `${products.length} product${products.length === 1 ? "" : "s"} found`}
      </p>

      {!loading && products.length === 0 && (
        <p className="text-slate-500">
          No products matched "{q}". Try a different keyword.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-100 p-3 relative">
            <div
              className="aspect-square rounded-lg bg-slate-50 grid place-items-center mb-2 cursor-pointer overflow-hidden"
              onClick={() => navigate(`/products/${p.slug}`)}
            >
              {p.thumbnail ? (
                <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>
            <h4
              className="text-sm font-medium line-clamp-2 mb-1 cursor-pointer"
              onClick={() => navigate(`/products/${p.slug}`)}
            >
              {p.title}
            </h4>
            <div className="flex items-center gap-2 text-sm mb-1">
              <span className="font-semibold">{money(p.price)}</span>
              {p.mrp > p.price && (
                <span className="text-slate-400 line-through text-xs">{money(p.mrp)}</span>
              )}
            </div>
            {offPercent(p.price, p.mrp) && (
              <div className="text-xs text-green-600 font-medium mb-2">
                {offPercent(p.price, p.mrp)}
              </div>
            )}
            <button
              onClick={() => addToCart(p)}
              className="w-full text-xs font-medium rounded-lg bg-brand-600 text-white py-2"
            >
              🛒 Add to Cart
            </button>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
