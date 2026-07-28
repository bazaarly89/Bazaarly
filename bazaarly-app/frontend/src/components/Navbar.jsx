import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/categories', label: 'Categories' },
    { to: '/products', label: 'Shop' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="container-app flex h-16 items-center gap-4">
        <button className="lg:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>

        <Link to="/" className="font-display text-2xl font-bold text-brand-600 shrink-0">Dostivox</Link>

        <nav className="hidden lg:flex items-center gap-6 ml-6">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-600 hover:text-brand-600 transition">{l.label}</Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden md:flex flex-1 max-w-md items-center">
          <div className="relative w-full">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, brands..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-brand-400"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </button>
          </div>
        </form>

        <div className="ml-auto md:ml-4 flex items-center gap-4">
          <Link to="/wishlist" className="hidden sm:inline-flex text-slate-600 hover:text-accent-500" aria-label="Wishlist">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-4.35-9.5-8.5C1 9 2.5 6 5.5 6c2 0 3.3 1.2 4 2.2C10.2 7.2 11.5 6 13.5 6 16.5 6 18 9 21 12.5 18.5 16.65 12 21 12 21z" /></svg>
          </Link>
          <Link to="/cart" className="relative text-slate-600 hover:text-brand-600" aria-label="Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6h15l-1.5 9h-12z" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
            {count > 0 && <span className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-accent-500 text-[10px] text-white">{count}</span>}
          </Link>
          {user ? (
            <div className="relative group">
              <button className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">{user.name?.[0] || 'U'}</button>
              <div className="absolute right-0 mt-2 hidden w-48 rounded-xl border border-slate-100 bg-white py-2 shadow-lg group-hover:block">
                <Link to="/account" className="block px-4 py-2 text-sm hover:bg-slate-50">My Account</Link>
                <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-slate-50">My Orders</Link>
                <Link to="/wishlist" className="block px-4 py-2 text-sm hover:bg-slate-50">Wishlist</Link>
                <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Logout</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-5">Sign In</Link>
          )}
        </div>
      </div>

      {/* Always-visible search bar on mobile — sits below the main row,
          not hidden inside the hamburger menu */}
      <form onSubmit={submitSearch} className="md:hidden border-t border-slate-100 px-4 py-2.5">
        <div className="relative w-full">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-brand-400"
          />
          <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          </button>
        </div>
      </form>

      {menuOpen && (
        <div className="lg:hidden border-t border-slate-100 px-4 py-3 space-y-2">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="block py-1.5 text-sm font-medium text-slate-700">{l.label}</Link>
          ))}
        </div>
      )}
    </header>
  );
}
