import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/products', 'Products'],
  ['/admin/categories', 'Categories'],
  ['/admin/inventory', 'Inventory'],
  ['/admin/orders', 'Orders'],
  ['/admin/customers', 'Customers'],
  ['/admin/coupons', 'Coupons'],
  ['/admin/banners', 'Banners'],
  ['/admin/advertisements', 'Advertisements'],
  ['/admin/reports', 'Reports'],
  ['/admin/analytics', 'Analytics'],
  ['/admin/settings', 'Settings'],
];

export default function AdminLayout() {
  const { admin, adminLogout } = useAuth();
  const navigate = useNavigate();

  const logout = () => { adminLogout(); navigate('/admin/login'); };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 text-slate-300 lg:flex">
        <div className="p-6"><p className="font-display text-xl font-bold text-white">Bazaarly</p><p className="text-xs text-slate-400">Admin Panel</p></div>
        <nav className="flex-1 space-y-1 px-3">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand-500 text-white' : 'hover:bg-slate-800'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <p className="text-xs text-slate-400">Signed in as</p>
          <p className="text-sm font-semibold text-white">{admin?.name}</p>
          <button onClick={logout} className="mt-3 w-full rounded-lg bg-slate-800 py-2 text-sm hover:bg-slate-700">Logout</button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 lg:hidden">
          <p className="font-display font-bold text-brand-600">Bazaarly Admin</p>
          <button onClick={logout} className="text-sm text-red-500">Logout</button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
