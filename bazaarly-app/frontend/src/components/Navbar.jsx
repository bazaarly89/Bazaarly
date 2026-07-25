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
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-brand-500 text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            </button>
          </div>
        </form>

        <div className="ml-auto md:ml-4 flex items-center gap-4">
          <Link to="/wishlist" className="hidden sm:inline-flex text-slate-600 hover:text-accent-500" aria-label="Wishlist">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7.5-4.6-10-9.1C.6 8.4 2 4.5 5.6 3.7 8 3.2 10 4.3 12 6.8c2-2.5 4-3.6 6.4-3.1 3.6.8 5 4.7 3.6 8.2C19.5 16.4 12 21 12 21z" /></svg>
          </Link>
          <Link to="/cart" className="relative text-slate-600 hover:text-brand-600" aria-label="Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6 5 2H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
            {count > 0 && <span className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-accent-500 text-[10px] font-bold text-white">{count}</span>}
          </Link>
          {user ? (
            <div className="relative group">
              <button className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">{user.name?.[0]?.toUpperCase()}</button>
              <div className="absolute right-0 mt-2 hidden w-48 rounded-xl border border-slate-100 bg-white py-2 shadow-cardHover group-hover:block animate-scaleIn">
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

      {menuOpen && (
        <div className="lg:hidden border-t border-slate-100 px-4 py-3 space-y-2">
          <form onSubmit={submitSearch} className="mb-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="input" />
          </form>
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="block py-1.5 text-sm font-medium text-slate-700">{l.label}</Link>
          ))}
        </div>
      )}
    </header>
  );
}
