import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-100 bg-white">
      <div className="container-app grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <h4 className="font-display text-xl font-bold text-brand-600">Dostivox</h4>
          <p className="mt-3 text-sm text-slate-500">Premium products, thoughtfully curated. Fast delivery, easy returns, and a shopping experience you'll love.</p>
        </div>
        <div>
          <h5 className="font-semibold text-slate-800">Shop</h5>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/products" className="hover:text-brand-600">All Products</Link></li>
            <li><Link to="/categories" className="hover:text-brand-600">Categories</Link></li>
            <li><Link to="/wishlist" className="hover:text-brand-600">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold text-slate-800">Support</h5>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/help" className="hover:text-brand-600">Help Center</Link></li>
            <li><Link to="/contact" className="hover:text-brand-600">Contact Us</Link></li>
            <li><Link to="/orders" className="hover:text-brand-600">Track Order</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold text-slate-800">Company</h5>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/about" className="hover:text-brand-600">About Us</Link></li>
            <li><Link to="/privacy" className="hover:text-brand-600">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-brand-600">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Dostivox. All rights reserved.
      </div>
    </footer>
  );
}
