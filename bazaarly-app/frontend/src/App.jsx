import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout, { RequireAuth, RequireAdmin } from './components/Layout';

// Public / customer pages
import Home from './components/Homepage';
import Categories from './pages/Categories';
import ProductListing from './pages/ProductListing';
import ProductDetails from './pages/ProductDetails';
import Search from './pages/Search';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import MyAccount from './pages/MyAccount';
import MyOrders from './pages/MyOrders';
import Wishlist from './pages/Wishlist';
import OrderTracking from './pages/OrderTracking';
import Contact from './pages/Contact';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import HelpCenter from './pages/HelpCenter';
import NotFound from './pages/NotFound';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminInventory from './pages/admin/AdminInventory';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminBanners from './pages/admin/AdminBanners';
import AdminHeroSlides from './pages/admin/AdminHeroSlides';
import AdminAdvertisements from './pages/admin/AdminAdvertisements';
import AdminReports from './pages/admin/AdminReports';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';

export default function App() {
  return (
    <Routes>
      {/* Admin routes (own layout, no public Navbar/Footer) */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="hero-slides" element={<AdminHeroSlides />} />
        <Route path="advertisements" element={<AdminAdvertisements />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Public / customer-facing routes */}
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/categories" element={<Layout><Categories /></Layout>} />
      <Route path="/categories/:slug" element={<Layout><ProductListing /></Layout>} />
      <Route path="/products" element={<Layout><ProductListing /></Layout>} />
      <Route path="/products/:slug" element={<Layout><ProductDetails /></Layout>} />
      <Route path="/search" element={<Layout><Search /></Layout>} />
      <Route path="/cart" element={<Layout><Cart /></Layout>} />
      <Route path="/checkout" element={<Layout><RequireAuth><Checkout /></RequireAuth></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
      <Route path="/account" element={<Layout><RequireAuth><MyAccount /></RequireAuth></Layout>} />
      <Route path="/orders" element={<Layout><RequireAuth><MyOrders /></RequireAuth></Layout>} />
      <Route path="/orders/:id" element={<Layout><RequireAuth><OrderTracking /></RequireAuth></Layout>} />
      <Route path="/wishlist" element={<Layout><RequireAuth><Wishlist /></RequireAuth></Layout>} />
      <Route path="/contact" element={<Layout><Contact /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
      <Route path="/terms" element={<Layout><Terms /></Layout>} />
      <Route path="/help" element={<Layout><HelpCenter /></Layout>} />
      <Route path="*" element={<Layout><NotFound /></Layout>} />
    </Routes>
  );
}
