import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/home-sections', 'Homepage Sections'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/merchants', 'Merchants'],
  ['/admin/inventory', 'Inventory'],
  ['/admin/orders', 'Orders'],
  ['/admin/customers', 'Customers'],
  ['/admin/coupons', 'Coupons'],
  ['/admin/banners', 'Banners'],
  ['/admin/hero-slides', 'Hero Slideshow'],
  ['/admin/trust-cards', 'Why Choose Us Cards'],
  ['/admin/navigation', 'Navigation Menu'],
  ['/admin/footer', 'Footer'],
  ['/admin/advertisements', 'Advertisements'],
  ['/admin/reports', 'Reports'],
  ['/admin/analytics', 'Analytics'],
  ['/admin/settings', 'Settings'],
];

export default function AdminLayout() {
  const { admin, adminLogout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => { adminLogout(); navigate('/admin/login'); };

  const navLinks = (
    <>
      {LINKS.map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) => `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
        >
          {label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 text-slate-300 lg:flex">
        <div className="p-6"><p className="font-display text-xl font-bold text-white">Dostivox</p><p className="text-xs text-slate-500">Admin Panel</p></div>
        <nav className="flex-1 space-y-1 px-3">{navLinks}</nav>
        <div className="border-t border-slate-800 p-4">
          <p className="text-xs text-slate-400">Signed in as</p>
          <p className="text-sm font-semibold text-white">{admin?.name}</p>
          <button onClick={logout} className="mt-3 w-full rounded-lg bg-slate-800 py-2 text-sm hover:bg-slate-700">Logout</button>
        </div>
      </aside>

      {/* Mobile slide-in drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="relative flex w-64 flex-col bg-slate-900 text-slate-300">
            <div className="flex items-center justify-between p-6">
              <div><p className="font-display text-xl font-bold text-white">Dostivox</p><p className="text-xs text-slate-500">Admin Panel</p></div>
              <button onClick={() => setMenuOpen(false)} className="text-2xl leading-none text-white">×</button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">{navLinks}</nav>
            <div className="border-t border-slate-800 p-4">
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm font-semibold text-white">{admin?.name}</p>
              <button onClick={logout} className="mt-3 w-full rounded-lg bg-slate-800 py-2 text-sm hover:bg-slate-700">Logout</button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 lg:hidden">
          <button onClick={() => setMenuOpen(true)} className="text-2xl leading-none text-brand-600" aria-label="Open menu">☰</button>
          <p className="font-display font-bold text-brand-600">Dostivox Admin</p>
          <button onClick={logout} className="text-sm text-red-500">Logout</button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
