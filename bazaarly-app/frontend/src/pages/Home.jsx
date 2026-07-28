import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../api/client";
import "./homepage.css";

/**
 * Dostivox Homepage — connected to the real backend/admin panel.
 * Drop this in place of the old Homepage.jsx (same folder, same
 * import path assumptions: pages/Home.jsx importing ../api/client).
 *
 * IMPORTANT: this file does NOT render its own header/nav/search bar
 * or footer — those already come from Layout.jsx (<Navbar /> and
 * <Footer />). Rendering them again here was what caused the
 * duplicate top bar.
 */

const money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const offPercent = (price, mrp) => {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100) + "% OFF";
};

export default function Homepage() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDot, setActiveDot] = useState(0);
  const [toast, setToast] = useState("");
  const [addedId, setAddedId] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      Api.heroSlides().catch(() => ({ slides: [] })),
      Api.categories().catch(() => ({ categories: [] })),
      Api.products({ limit: 16, sort: "popular" }).catch(() => ({ products: [] })),
    ]).then(([slideRes, catRes, prodRes]) => {
      if (!mounted) return;
      setSlides(slideRes.slides || []);
      setCategories((catRes.categories || []).filter((c) => c.is_active !== false && c.is_active !== 0));
      setProducts(prodRes.products || []);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  // hero autoplay
  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(() => setActiveDot((d) => (d + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

const addToCart = async (product) => {
  try {
    await Api.addToCart(product.id, 1);
    showToast(product.title + " added to cart");
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  } catch (e) {
    showToast("Please sign in to add to cart");
    if (!localStorage.getItem("token")) {
      setTimeout(() => navigate("/login"), 900);
    }
  }
};

const addToWishlist = async (product) => {
  try {
    await Api.addWishlist(product.id);
    showToast(product.title + " added to wishlist");
  } catch (e) {
    showToast("Please sign in to use wishlist");
    if (!localStorage.getItem("token")) {
      setTimeout(() => navigate("/login"), 900);
    }
  }
};

  const goToCategory = (cat) => navigate(`/products?category=${cat.slug}`);
  const goToProduct = (p) => navigate(`/products/${p.slug}`);

  // "Today's Deals" — reuse the same product batch, just show the
  // ones with the biggest discount first. If you'd rather have deals
  // be admin-controlled separately, that needs its own backend flag —
  // let me know and I'll add it.
  const deals = [...products]
    .filter((p) => p.mrp && p.mrp > p.price)
    .sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp)
    .slice(0, 4);

  const trending = products.slice(0, 8);

  if (loading) {
    return <div className="dv-loading">Loading Dostivox…</div>;
  }

  return (
    <div className="dv-page">
      {/* HERO SLIDESHOW — admin-editable via /admin/banners (hero slides) */}
      {slides.length > 0 && (
        <div className="dv-banner-wrap">
          <div
            className="dv-banner"
            style={{
              backgroundImage: slides[activeDot]?.image ? `url(${slides[activeDot].image})` : undefined,
              backgroundSize: slides[activeDot]?.imageFit === "cover" ? "cover" : "contain",
            }}
          >
            {slides[activeDot]?.mode !== "image_only" && (
              <div className="dv-banner-text">
                {slides[activeDot]?.eyebrow && <span className="dv-tag">{slides[activeDot].eyebrow}</span>}
                <h1>{slides[activeDot]?.title}</h1>
                {slides[activeDot]?.subtitle && <p>{slides[activeDot].subtitle}</p>}
                {Array.isArray(slides[activeDot]?.specs) && slides[activeDot].specs.length > 0 && (
                  <ul className="dv-specs">
                    {slides[activeDot].specs.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                )}
                {slides[activeDot]?.ctaText && (
                  <button
                    className="dv-shop-now"
                    onClick={() => slides[activeDot].ctaLink ? navigate(slides[activeDot].ctaLink) : document.getElementById("dv-trending")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    {slides[activeDot].ctaText}
                  </button>
                )}
              </div>
            )}
          </div>
          {slides.length > 1 && (
            <div className="dv-dots">
              {slides.map((_, i) => (
                <span key={i} className={"dv-dot" + (i === activeDot ? " active" : "")} onClick={() => setActiveDot(i)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SHOP BY CATEGORY — admin-editable via /admin/categories */}
      {categories.length > 0 && (
        <div className="dv-section">
          <div className="dv-sec-head"><h2>Shop by Category</h2></div>
          <div className="dv-cat-grid">
            {categories.map((c) => (
              <div className="dv-cat-item" key={c.id} onClick={() => goToCategory(c)}>
                <div className="dv-cat-img">
                  {c.image ? <img src={c.image} alt={c.name} /> : "🛍"}
                </div>
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRENDING PRODUCTS — admin-editable via /admin/products */}
      <div className="dv-section" id="dv-trending">
        <div className="dv-sec-head">
          <h2>Trending Products</h2>
          <a className="dv-view-all" onClick={() => navigate("/products")}>View All ›</a>
        </div>
        <div className="dv-prod-grid">
          {trending.map((p) => (
            <div className="dv-card" key={p.id}>
              <button className="dv-wish" onClick={() => addToWishlist(p)}>♡</button>
              <div className="dv-img-box" onClick={() => goToProduct(p)}>
                {p.thumbnail ? <img src={p.thumbnail} alt={p.title} /> : "📦"}
              </div>
              <h4 onClick={() => goToProduct(p)}>{p.title}</h4>
              {p.rating != null && (
                <div className="dv-stars">★ {p.rating} <span>({(p.rating_count || 0).toLocaleString("en-IN")})</span></div>
              )}
              <div className="dv-price">
                <span className="now">{money(p.price)}</span>
                {p.mrp > p.price && <span className="old">{money(p.mrp)}</span>}
              </div>
              {offPercent(p.price, p.mrp) && <div className="dv-off-tag">{offPercent(p.price, p.mrp)}</div>}
              <button
                className={"dv-add-cart" + (addedId === p.id ? " added" : "")}
                onClick={() => addToCart(p)}
              >
                {addedId === p.id ? "✓ Added" : "🛒 Add to Cart"}
              </button>
            </div>
          ))}
          {trending.length === 0 && <p style={{ color: "#6b7280", fontSize: 14 }}>No products yet — add some from the admin panel.</p>}
        </div>
      </div>

      {/* TODAY'S DEALS */}
      {deals.length > 0 && (
        <div className="dv-section">
          <div className="dv-sec-head">
            <h2>Today's Deals</h2>
            <a className="dv-view-all" onClick={() => navigate("/products?sort=price_asc")}>View All ›</a>
          </div>
          <div className="dv-deal-grid">
            {deals.map((d, i) => (
              <div className={"dv-deal-card deal" + ((i % 4) + 1)} key={d.id}>
                <div className="dv-img-box" onClick={() => goToProduct(d)}>
                  {d.thumbnail ? <img src={d.thumbnail} alt={d.title} /> : "📦"}
                </div>
                <div className="dv-sub">{d.brand}</div>
                <h4 onClick={() => goToProduct(d)}>{d.title}</h4>
                <div className="dv-price">
                  <span className="now">{money(d.price)}</span>
                  <span className="old">{money(d.mrp)}</span>
                </div>
                <div className="dv-off-tag">{offPercent(d.price, d.mrp)}</div>
                <button className={"dv-deal-btn deal-btn" + ((i % 4) + 1)} onClick={() => addToCart(d)}>
                  🛒 Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WHY CHOOSE — static, not admin-driven (nothing in backend tracks this) */}
      <div className="dv-section">
        <div className="dv-sec-head"><h2>Why Choose Dostivox?</h2></div>
        <div className="dv-why-grid">
          <div className="dv-why-card"><div className="dv-wi" style={{ background: "#fee2e2", color: "#ef4444" }}>%</div><h4>Best Prices</h4><p>Guaranteed</p></div>
          <div className="dv-why-card"><div className="dv-wi" style={{ background: "#dcfce7", color: "#16a34a" }}>✓</div><h4>Genuine Products</h4><p>100% Original</p></div>
          <div className="dv-why-card"><div className="dv-wi" style={{ background: "#dcfce7", color: "#16a34a" }}>🚚</div><h4>Fast Delivery</h4><p>Across India</p></div>
          <div className="dv-why-card"><div className="dv-wi" style={{ background: "#dbeafe", color: "#2563eb" }}>🎧</div><h4>24/7 Customer Support</h4><p>We're here to help</p></div>
        </div>
      </div>

{toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#111827", color: "#fff", padding: "10px 20px", borderRadius: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
