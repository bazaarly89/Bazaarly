import React, { useState, useEffect, useRef } from "react";
import "./homepage.css";

/**
 * Full Dostivox homepage — self-contained (no dependency on TopBar,
 * SearchBar, CategoryNav, HeroCarousel, AllProducts, SuggestedForYou,
 * PromoTiles, BottomNav). Replace the old Homepage.jsx with this file
 * and add homepage.css alongside it — that's it.
 */

const categories = [
  { name: "Electronics", icon: "🎧" },
  { name: "Fashion", icon: "👗" },
  { name: "Home & Kitchen", icon: "🏠" },
  { name: "Beauty & Health", icon: "💄" },
  { name: "Sports & Fitness", icon: "🏋" },
  { name: "Toys & Kids", icon: "🧸" },
];

const products = [
  { id: 1, name: "boAt Wave Sigma 3 Smart Watch", icon: "⌚", rating: 4.6, reviews: 1245, price: 1299, old: 2999, off: "57% OFF" },
  { id: 2, name: "Realme Buds T300 Wireless Earbuds", icon: "🎧", rating: 4.5, reviews: 982, price: 1499, old: 2999, off: "50% OFF" },
  { id: 3, name: "Skybags Brat Black Laptop Backpack", icon: "🎒", rating: 4.4, reviews: 765, price: 899, old: 1999, off: "55% OFF" },
  { id: 4, name: "Puma Men's Running Shoes", icon: "👟", rating: 4.3, reviews: 1102, price: 1799, old: 3599, off: "50% OFF" },
  { id: 5, name: "Wild Stone Ultra Perfume", icon: "🍾", rating: 4.4, reviews: 850, price: 249, old: 499, off: "50% OFF" },
];

const deals = [
  { id: 101, name: "Boult Audio BassBuds X1", sub: "Boult Audio", icon: "🎧", price: 699, old: 1499, off: "53% OFF", cls: "deal1", btn: "deal-btn1" },
  { id: 102, name: "Lavie Women's Handbag", sub: "Lavie", icon: "👜", price: 949, old: 2199, off: "57% OFF", cls: "deal2", btn: "deal-btn2" },
  { id: 103, name: "AGARO Royal Air Fryer", sub: "AGARO", icon: "🍟", price: 2999, old: 5999, off: "50% OFF", cls: "deal3", btn: "deal-btn3" },
  { id: 104, name: "Redmi Note 13 (8GB+128GB)", sub: "Redmi", icon: "📱", price: 12999, old: 18999, off: "31% OFF", cls: "deal4", btn: "deal-btn4" },
];

const testimonials = [
  { name: "Rahul Sharma", text: "Great quality products and fast delivery. Highly recommended!" },
  { name: "Priya Mehta", text: "Amazing shopping experience. I will shop again!" },
  { name: "Amit Verma", text: "Best prices and excellent customer support." },
];

const money = (n) => "₹" + n.toLocaleString("en-IN");

export default function Homepage({ customerName }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [query, setQuery] = useState("");
  const [activeDot, setActiveDot] = useState(0);
  const [seconds, setSeconds] = useState(12 * 3600 + 45 * 60 + 30);
  const [showCart, setShowCart] = useState(false);
  const [showWish, setShowWish] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [toast, setToast] = useState("");
  const [addedId, setAddedId] = useState(null);
  const toastTimer = useRef(null);
  const searchRef = useRef(null);

  // banner autoplay
  useEffect(() => {
    const t = setInterval(() => setActiveDot((d) => (d + 1) % 5), 4000);
    return () => clearInterval(t);
  }, []);

  // countdown timer
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
    showToast(item.name + " added to cart");
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const toggleWish = (item) => {
    setWishlist((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      return [...prev, item];
    });
  };

  const checkout = () => {
    if (cart.length === 0) return showToast("Cart is empty");
    showToast("Order placed successfully! (demo)");
    setCart([]);
    setShowCart(false);
  };

  const subscribe = (e) => {
    e.preventDefault();
    const email = e.target.elements.subEmail.value;
    showToast("Subscribed with " + email + "!");
    e.target.reset();
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="dv-page">
      {/* HEADER */}
      <header className="dv-top">
        <div className="dv-top-inner">
          <button className="dv-menu-btn" aria-label="Menu">☰</button>
          <div className="dv-logo">🛒D<b>ostivox</b></div>
          <div className="dv-icons">
            <button className="dv-icon-btn" onClick={() => searchRef.current?.focus()}>
              🔍<small>Search</small>
            </button>
            <button className="dv-icon-btn" onClick={() => setShowWish(true)}>
              ♡<small>Wishlist</small>
              <span className="dv-badge">{wishlist.length}</span>
            </button>
            <button className="dv-icon-btn" onClick={() => setShowCart(true)}>
              🛒<small>Cart</small>
              <span className="dv-badge">{cartCount}</span>
            </button>
            <button className="dv-icon-btn" onClick={() => setShowSignIn(true)}>
              👤<small>{customerName ? customerName : "Sign In"}</small>
            </button>
          </div>
        </div>
        <div className="dv-search-bar">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search for products, brands and more..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") document.getElementById("dv-trending")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <button onClick={() => document.getElementById("dv-trending")?.scrollIntoView({ behavior: "smooth" })}>
            Search
          </button>
        </div>
      </header>

      {/* BANNER */}
      <div className="dv-banner-wrap">
        <div className="dv-banner">
          <span className="dv-limited">LIMITED<br />TIME OFFER</span>
          <div className="dv-banner-text">
            <span className="dv-tag">BIG SAVINGS</span>
            <h1>MEGA <span className="dv-hl">SALE</span></h1>
            <div className="dv-off">UP TO 50% OFF</div>
            <p>On Top Deals &amp; Bestsellers</p>
            <button className="dv-shop-now" onClick={() => document.getElementById("dv-trending")?.scrollIntoView({ behavior: "smooth" })}>
              Shop Now
            </button>
          </div>
          <div className="dv-banner-img">🎧📱👜</div>
        </div>
        <div className="dv-dots">
          {[0, 1, 2, 3, 4].map((i) => (
            <button key={i} className={"dv-dot" + (i === activeDot ? " active" : "")} onClick={() => setActiveDot(i)} />
          ))}
        </div>
      </div>

      {/* PERKS */}
      <div className="dv-perks">
        <div className="dv-perk"><div className="dv-pi" style={{ background: "#dbeafe", color: "#2563eb" }}>🚚</div><div><h4>Free Shipping</h4><p>On all orders</p></div></div>
        <div className="dv-perk"><div className="dv-pi" style={{ background: "#dcfce7", color: "#16a34a" }}>💰</div><div><h4>Cash on Delivery</h4><p>Pay on delivery</p></div></div>
        <div className="dv-perk"><div className="dv-pi" style={{ background: "#dbeafe", color: "#2563eb" }}>🔒</div><div><h4>Secure Payment</h4><p>100% secure</p></div></div>
        <div className="dv-perk"><div className="dv-pi" style={{ background: "#ede9fe", color: "#7c3aed" }}>↺</div><div><h4>Easy Returns</h4><p>7 days return</p></div></div>
      </div>

      {/* CATEGORIES */}
      <div className="dv-section">
        <div className="dv-sec-head"><h2>Shop by Category</h2><a className="dv-view-all" href="#">View All ›</a></div>
        <div className="dv-cat-grid">
          {categories.map((c) => (
            <div className="dv-cat-item" key={c.name}>
              <div className="dv-cat-img">{c.icon}</div>
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TRENDING PRODUCTS */}
      <div className="dv-section" id="dv-trending">
        <div className="dv-sec-head"><h2>Trending Products</h2><a className="dv-view-all" href="#">View All ›</a></div>
        <div className="dv-prod-grid">
          {filteredProducts.map((p) => {
            const wished = wishlist.some((w) => w.id === p.id);
            return (
              <div className="dv-card" key={p.id}>
                <button
                  className={"dv-wish" + (wished ? " active" : "")}
                  onClick={() => toggleWish({ id: p.id, name: p.name, price: p.price })}
                >
                  {wished ? "❤" : "♡"}
                </button>
                <div className="dv-img-box">{p.icon}</div>
                <h4>{p.name}</h4>
                <div className="dv-stars">★ {p.rating} <span>({p.reviews.toLocaleString("en-IN")})</span></div>
                <div className="dv-price"><span className="now">{money(p.price)}</span><span className="old">{money(p.old)}</span></div>
                <div className="dv-off-tag">{p.off}</div>
                <button
                  className={"dv-add-cart" + (addedId === p.id ? " added" : "")}
                  onClick={() => addToCart({ id: p.id, name: p.name, price: p.price })}
                >
                  {addedId === p.id ? "✓ Added" : "🛒 Add to Cart"}
                </button>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <p style={{ color: "#6b7280", fontSize: 14 }}>No products found for "{query}"</p>
          )}
        </div>
      </div>

      {/* TODAY'S DEALS */}
      <div className="dv-section">
        <div className="dv-sec-head">
          <h2>Today's Deals <span className="dv-timer-badge">{fmt(seconds)}</span></h2>
          <a className="dv-view-all" href="#">View All ›</a>
        </div>
        <div className="dv-deal-grid">
          {deals.map((d) => (
            <div className={"dv-deal-card " + d.cls} key={d.id}>
              <div className="dv-img-box">{d.icon}</div>
              <div className="dv-sub">{d.sub}</div>
              <h4>{d.name}</h4>
              <div className="dv-price"><span className="now">{money(d.price)}</span><span className="old">{money(d.old)}</span></div>
              <div className="dv-off-tag">{d.off}</div>
              <button
                className={"dv-deal-btn " + d.btn}
                onClick={() => addToCart({ id: d.id, name: d.name, price: d.price })}
              >
                🛒 Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* WHY CHOOSE */}
      <div className="dv-section">
        <div className="dv-sec-head"><h2>Why Choose Dostivox?</h2></div>
        <div className="dv-why-grid">
          <div className="dv-why-card"><div className="dv-wi" style={{ background: "#fee2e2", color: "#ef4444" }}>%</div><h4>Best Prices</h4><p>Guaranteed</p></div>
          <div className="dv-why-card"><div className="dv-wi" style={{ background: "#dcfce7", color: "#16a34a" }}>✓</div><h4>Genuine Products</h4><p>100% Original</p></div>
          <div className="dv-why-card"><div className="dv-wi" style={{ background: "#dcfce7", color: "#16a34a" }}>🚚</div><h4>Fast Delivery</h4><p>Across India</p></div>
          <div className="dv-why-card"><div className="dv-wi" style={{ background: "#dbeafe", color: "#2563eb" }}>🎧</div><h4>24/7 Customer Support</h4><p>We're here to help</p></div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div className="dv-section">
        <div className="dv-sec-head"><h2>What Our Customers Say</h2><a className="dv-view-all" href="#">View All ›</a></div>
        <div className="dv-test-grid">
          {testimonials.map((t) => (
            <div className="dv-test-card" key={t.name}>
              <div className="dv-test-head">
                <div className="dv-avatar">{t.name[0]}</div>
                <div><h5>{t.name}</h5><div className="dv-stars">★★★★★</div></div>
              </div>
              <p>{t.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* NEWSLETTER */}
      <div className="dv-newsletter">
        <div className="dv-newsletter-inner">
          <div className="dv-left">✉ <div>Subscribe to get updates on<br />new arrivals, offers &amp; more</div></div>
          <form onSubmit={subscribe}>
            <input name="subEmail" type="email" required placeholder="Enter your email address" />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="dv-footer">
        <div className="dv-footer-inner">
          <div><h5>ABOUT</h5><a href="#">About Us</a><a href="#">Careers</a><a href="#">Store Locator</a></div>
          <div><h5>CUSTOMER SERVICE</h5><a href="#">Contact Us</a><a href="#">Track Order</a><a href="#">FAQ</a></div>
          <div><h5>POLICY</h5><a href="#">Privacy Policy</a><a href="#">Refund Policy</a><a href="#">Shipping Policy</a><a href="#">Terms &amp; Conditions</a></div>
          <div>
            <h5>CONNECT WITH US</h5>
            <div className="dv-socials"><span>f</span><span>📷</span><span>▶</span><span>🐦</span></div>
            <h5 style={{ marginTop: 14 }}>Secure Payments</h5>
            <div className="dv-pay"><span>VISA</span><span>Mastercard</span><span>RuPay</span><span>UPI</span></div>
          </div>
        </div>
        <div className="dv-copyright">© 2025 Dostivox. All Rights Reserved.</div>
      </footer>

      <button className="dv-whatsapp-fab" onClick={() => showToast("WhatsApp chat opening... (demo)")}>💬</button>

      {toast && <div className="dv-toast show">{toast}</div>}

      {/* SIGN IN MODAL */}
      {showSignIn && (
        <div className="dv-modal-overlay show" onClick={(e) => e.target === e.currentTarget && setShowSignIn(false)}>
          <div className="dv-modal">
            <button className="dv-close" onClick={() => setShowSignIn(false)}>×</button>
            <h3>Sign In to Dostivox</h3>
            <input type="text" placeholder="Mobile number or email" />
            <input type="password" placeholder="Password" />
            <button className="dv-primary" onClick={() => { showToast("Signed in successfully! (demo)"); setShowSignIn(false); }}>Sign In</button>
            <p style={{ textAlign: "center", fontSize: 13, marginTop: 12, color: "#6b7280" }}>
              New here? <a href="#" style={{ color: "#2563eb" }}>Create account</a>
            </p>
          </div>
        </div>
      )}

      {/* CART MODAL */}
      {showCart && (
        <div className="dv-modal-overlay show" onClick={(e) => e.target === e.currentTarget && setShowCart(false)}>
          <div className="dv-modal">
            <button className="dv-close" onClick={() => setShowCart(false)}>×</button>
            <h3>Your Cart</h3>
            <div className="dv-cart-list">
              {cart.length === 0 && <p style={{ color: "#6b7280", fontSize: 13 }}>Your cart is empty.</p>}
              {cart.map((i) => (
                <div className="dv-cart-row" key={i.id}>
                  <span>{i.name} x{i.qty}</span>
                  <span>{money(i.price * i.qty)} <button onClick={() => removeFromCart(i.id)}>Remove</button></span>
                </div>
              ))}
            </div>
            <div className="dv-cart-total"><span>Total</span><span>{money(cartTotal)}</span></div>
            <button className="dv-primary" onClick={checkout}>Proceed to Checkout</button>
          </div>
        </div>
      )}

      {/* WISHLIST MODAL */}
      {showWish && (
        <div className="dv-modal-overlay show" onClick={(e) => e.target === e.currentTarget && setShowWish(false)}>
          <div className="dv-modal">
            <button className="dv-close" onClick={() => setShowWish(false)}>×</button>
            <h3>Your Wishlist</h3>
            <div className="dv-cart-list">
              {wishlist.length === 0 && <p style={{ color: "#6b7280", fontSize: 13 }}>No items in wishlist.</p>}
              {wishlist.map((i) => (
                <div className="dv-cart-row" key={i.id}>
                  <span>{i.name}</span>
                  <span>{money(i.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
