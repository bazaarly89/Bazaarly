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
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [trustCards, setTrustCards] = useState([]);
  const [homeSections, setHomeSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDot, setActiveDot] = useState(0);
  const [toast, setToast] = useState("");
  const [addedId, setAddedId] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      Api.heroSlides().catch(() => ({ slides: [] })),
      Api.banners().catch(() => ({ banners: [] })),
      Api.categories().catch(() => ({ categories: [] })),
      Api.products({ limit: 16, sort: "popular" }).catch(() => ({ products: [] })),
      Api.trustCards().catch(() => ({ cards: [] })),
      Api.homeSections().catch(() => ({ sections: [] })),
    ]).then(([slideRes, bannerRes, catRes, prodRes, trustRes, sectionRes]) => {
      if (!mounted) return;
      setSlides(slideRes.slides || []);
      setBanners(bannerRes.banners || []);
      setCategories((catRes.categories || []).filter((c) => c.is_active !== false && c.is_active !== 0));
      setProducts(prodRes.products || []);
      setTrustCards(trustRes.cards || []);
      setHomeSections(sectionRes.sections || []);
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

  // section config from /admin/home-sections (title, subtitle, button, order) — falls back to defaults if not yet set
  const sec = (key, fallbackTitle) => homeSections.find((s) => s.key === key) || { title: fallbackTitle, subtitle: '', buttonText: '', buttonLink: '' };
  const sectionOrder = homeSections.length
    ? [...homeSections].sort((a, b) => a.position - b.position).map((s) => s.key)
    : ['categories', 'trending', 'deals', 'trust_cards'];

  if (loading) {
    return <div className="dv-loading">Loading Dostivox…</div>;
  }

  return (
    <div className="dv-page">
      {/* HERO SLIDESHOW – admin-editable via /admin/banners (hero slides) */}
      {slides.length > 0 && (
        <div className="dv-banner-wrap">
          <div
            className="dv-banner"
            style={{
              backgroundImage: `url(${slides[activeDot].image})`,
              backgroundSize: slides[activeDot]?.imageFit === "cover" ? "cover" : "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
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

      {/* PROMO BANNERS — admin-editable via /admin/banners (separate from the
          hero slideshow above, which comes from /admin/hero-slides). Shows
          nothing if no banners are marked visible. */}
      {banners.length > 0 && (
        <div className="dv-promo-wrap">
          {banners.map((b) => (
            <div
              key={b.id}
              className="dv-promo-item"
              onClick={() => b.link && navigate(b.link)}
              style={{ cursor: b.link ? "pointer" : "default" }}
            >
              <img src={b.image} alt={b.title || "Offer"} />
            </div>
          ))}
        </div>
      )}

      {/* SECTIONS BELOW HERO — order, titles, subtitles and buttons controlled from
          Admin → Homepage Sections. Each block still only shows if there's data. */}
      {sectionOrder.map((key) => {
        if (key === 'categories' && categories.length > 0) {
          const s = sec('categories', 'Shop by Category');
          return (
            <div className="dv-section" key="categories">
              <div className="dv-sec-head">
                <h2>{s.title || 'Shop by Category'}</h2>
                {s.subtitle && <p className="dv-sec-sub">{s.subtitle}</p>}
              </div>
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
          );
        }

        if (key === 'trending') {
          const s = sec('trending', 'Trending Products');
          return (
            <div className="dv-section" id="dv-trending" key="trending">
              <div className="dv-sec-head">
                <div>
                  <h2>{s.title || 'Trending Products'}</h2>
                  {s.subtitle && <p className="dv-sec-sub">{s.subtitle}</p>}
                </div>
                <a className="dv-view-all" onClick={() => navigate(s.buttonLink || "/products")}>{s.buttonText || 'View All ›'}</a>
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
          );
        }

        if (key === 'deals' && deals.length > 0) {
          const s = sec('deals', "Today's Deals");
          return (
            <div className="dv-section" key="deals">
              <div className="dv-sec-head">
                <div>
                  <h2>{s.title || "Today's Deals"}</h2>
                  {s.subtitle && <p className="dv-sec-sub">{s.subtitle}</p>}
                </div>
                <a className="dv-view-all" onClick={() => navigate(s.buttonLink || "/products?sort=price_asc")}>{s.buttonText || 'View All ›'}</a>
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
          );
        }

        if (key === 'trust_cards' && trustCards.length > 0) {
          const s = sec('trust_cards', 'Why Choose Dostivox?');
          return (
            <div className="dv-section" key="trust_cards">
              <div className="dv-sec-head">
                <h2>{s.title || 'Why Choose Dostivox?'}</h2>
                {s.subtitle && <p className="dv-sec-sub">{s.subtitle}</p>}
              </div>
              <div className="dv-why-grid">
                {trustCards.map((c) => (
                  <div className="dv-why-card" key={c.id}>
                    <div className="dv-wi" style={{ background: "#f3f4f6", color: "#111827" }}>{c.icon}</div>
                    <h4>{c.title}</h4>
                    <p>{c.description}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#111827", color: "#fff", padding: "10px 20px", borderRadius: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
