import axios from 'axios';

// In local dev this stays '/api' and Vite's proxy forwards it to localhost:5000.
// In production (Vercel), set VITE_API_URL to your deployed backend URL, e.g.
// https://your-backend.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL: BASE_URL });
export const adminApi = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// The admin login session (JWT) expires after 12 hours, but the admin panel
// keeps showing "logged in" using a locally cached profile — so every admin
// screen looked fine while every actual save/fetch silently failed with 401.
// This catches that everywhere at once: on any expired/invalid session, clear
// the stale session and send the admin back to log in again.
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_profile');
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

function unwrap(promise) {
  return promise.then((r) => r.data).catch((e) => {
    const message = e?.response?.data?.error || 'Something went wrong. Please try again.';
    throw new Error(message);
  });
}

export const Api = {
  // auth
  register: (data) => unwrap(api.post('/auth/register', data)),
  login: (data) => unwrap(api.post('/auth/login', data)),
  me: () => unwrap(api.get('/auth/me')),
  updateMe: (data) => unwrap(api.put('/auth/me', data)),
  forgotPassword: (email) => unwrap(api.post('/auth/forgot-password', { email })),
  resetPassword: (data) => unwrap(api.post('/auth/reset-password', data)),

  // catalog
  products: (params) => unwrap(api.get('/products', { params })),
  product: (slug) => unwrap(api.get(`/products/${slug}`)),
  brands: () => unwrap(api.get('/products/brands')),
  categories: () => unwrap(api.get('/categories')),
  category: (slug) => unwrap(api.get(`/categories/${slug}`)),

  // homepage banners (public, read-only)
  banners: () => unwrap(api.get('/banners')),
siteContent: () => unwrap(api.get('/content')),
  // homepage hero slideshow (public, read-only)
  heroSlides: () => unwrap(api.get('/hero-slides')),
  // homepage "Why Choose Dostivox?" cards (public, read-only)
  trustCards: () => unwrap(api.get('/trust-cards')),
  navigation: () => unwrap(api.get('/navigation')),
  footer: () => unwrap(api.get('/footer')),
  homeSections: () => unwrap(api.get('/home-sections')),

  // buying guides / blog (public, read-only)
  articles: (params) => unwrap(api.get('/articles', { params })),
  article: (slug) => unwrap(api.get(`/articles/${slug}`)),
  articleCategories: () => unwrap(api.get('/articles/categories')),

  // cart
  getCart: () => unwrap(api.get('/cart')),
  addToCart: (productId, quantity = 1) => unwrap(api.post('/cart', { productId, quantity })),
  updateCartItem: (id, quantity) => unwrap(api.put(`/cart/${id}`, { quantity })),
  removeCartItem: (id) => unwrap(api.delete(`/cart/${id}`)),
  clearCart: () => unwrap(api.delete('/cart')),

  // wishlist
  getWishlist: () => unwrap(api.get('/wishlist')),
  addWishlist: (productId) => unwrap(api.post('/wishlist', { productId })),
  removeWishlist: (productId) => unwrap(api.delete(`/wishlist/${productId}`)),

  // addresses
  getAddresses: () => unwrap(api.get('/addresses')),
  addAddress: (data) => unwrap(api.post('/addresses', data)),
  updateAddress: (id, data) => unwrap(api.put(`/addresses/${id}`, data)),
  deleteAddress: (id) => unwrap(api.delete(`/addresses/${id}`)),

  // reviews
  addReview: (data) => unwrap(api.post('/reviews', data)),

  // coupons
  validateCoupon: (code, orderValue) => unwrap(api.post('/coupons/validate', { code, orderValue })),

  // orders
  createRazorpayOrder: (couponCode) => unwrap(api.post('/orders/razorpay/create', { couponCode })),
  verifyRazorpayPayment: (data) => unwrap(api.post('/orders/razorpay/verify', data)),
  placeCODOrder: (data) => unwrap(api.post('/orders/cod', data)),
  myOrders: () => unwrap(api.get('/orders')),
  orderDetails: (id) => unwrap(api.get(`/orders/${id}`)),
  cancelOrder: (id) => unwrap(api.post(`/orders/${id}/cancel`)),

  // notifications
  notifications: () => unwrap(api.get('/notifications')),
  markNotificationRead: (id) => unwrap(api.put(`/notifications/${id}/read`)),
};

export const AdminApi = {
  login: (data) => unwrap(adminApi.post('/auth/admin/login', data)),
  dashboard: () => unwrap(adminApi.get('/admin/dashboard')),

  products: () => unwrap(adminApi.get('/admin/products')),
  createProduct: (data) => unwrap(adminApi.post('/admin/products', data)),
  updateProduct: (id, data) => unwrap(adminApi.put(`/admin/products/${id}`, data)),
  deleteProduct: (id) => unwrap(adminApi.delete(`/admin/products/${id}`)),

  inventory: () => unwrap(adminApi.get('/admin/inventory')),
  updateStock: (id, stock) => unwrap(adminApi.put(`/admin/inventory/${id}`, { stock })),

  categories: () => unwrap(adminApi.get('/admin/categories')),
  createCategory: (data) => unwrap(adminApi.post('/admin/categories', data)),
  updateCategory: (id, data) => unwrap(adminApi.put(`/admin/categories/${id}`, data)),
  deleteCategory: (id) => unwrap(adminApi.delete(`/admin/categories/${id}`)),

  merchants: () => unwrap(adminApi.get('/admin/merchants')),
  createMerchant: (data) => unwrap(adminApi.post('/admin/merchants', data)),
  updateMerchant: (id, data) => unwrap(adminApi.put(`/admin/merchants/${id}`, data)),
  deleteMerchant: (id) => unwrap(adminApi.delete(`/admin/merchants/${id}`)),

  orders: (status) => unwrap(adminApi.get('/admin/orders', { params: { status } })),
  orderDetails: (id) => unwrap(adminApi.get(`/admin/orders/${id}`)),
  updateOrderStatus: (id, status, note) => unwrap(adminApi.put(`/admin/orders/${id}/status`, { status, note })),

  customers: () => unwrap(adminApi.get('/admin/customers')),

  coupons: () => unwrap(adminApi.get('/admin/coupons')),
  createCoupon: (data) => unwrap(adminApi.post('/admin/coupons', data)),
  updateCoupon: (id, data) => unwrap(adminApi.put(`/admin/coupons/${id}`, data)),
  deleteCoupon: (id) => unwrap(adminApi.delete(`/admin/coupons/${id}`)),

  banners: () => unwrap(adminApi.get('/admin/banners')),
  createBanner: (data) => unwrap(adminApi.post('/admin/banners', data)),
  updateBanner: (id, data) => unwrap(adminApi.put(`/admin/banners/${id}`, data)),
  deleteBanner: (id) => unwrap(adminApi.delete(`/admin/banners/${id}`)),

  advertisements: () => unwrap(adminApi.get('/admin/advertisements')),
  createAd: (data) => unwrap(adminApi.post('/admin/advertisements', data)),
  deleteAd: (id) => unwrap(adminApi.delete(`/admin/advertisements/${id}`)),

  heroSlides: () => unwrap(adminApi.get('/admin/hero-slides')),
  createHeroSlide: (data) => unwrap(adminApi.post('/admin/hero-slides', data)),
  updateHeroSlide: (id, data) => unwrap(adminApi.put(`/admin/hero-slides/${id}`, data)),
  deleteHeroSlide: (id) => unwrap(adminApi.delete(`/admin/hero-slides/${id}`)),

  trustCards: () => unwrap(adminApi.get('/admin/trust-cards')),
  createTrustCard: (data) => unwrap(adminApi.post('/admin/trust-cards', data)),
  updateTrustCard: (id, data) => unwrap(adminApi.put(`/admin/trust-cards/${id}`, data)),
  deleteTrustCard: (id) => unwrap(adminApi.delete(`/admin/trust-cards/${id}`)),

  navItems: () => unwrap(adminApi.get('/admin/nav-items')),
  createNavItem: (data) => unwrap(adminApi.post('/admin/nav-items', data)),
  updateNavItem: (id, data) => unwrap(adminApi.put(`/admin/nav-items/${id}`, data)),
  deleteNavItem: (id) => unwrap(adminApi.delete(`/admin/nav-items/${id}`)),

  footerColumns: () => unwrap(adminApi.get('/admin/footer-columns')),
  createFooterColumn: (data) => unwrap(adminApi.post('/admin/footer-columns', data)),
  updateFooterColumn: (id, data) => unwrap(adminApi.put(`/admin/footer-columns/${id}`, data)),
  deleteFooterColumn: (id) => unwrap(adminApi.delete(`/admin/footer-columns/${id}`)),
  createFooterLink: (data) => unwrap(adminApi.post('/admin/footer-links', data)),
  updateFooterLink: (id, data) => unwrap(adminApi.put(`/admin/footer-links/${id}`, data)),
  deleteFooterLink: (id) => unwrap(adminApi.delete(`/admin/footer-links/${id}`)),

  homeSections: () => unwrap(adminApi.get('/admin/home-sections')),
  updateHomeSection: (id, data) => unwrap(adminApi.put(`/admin/home-sections/${id}`, data)),
  reorderHomeSections: (order) => unwrap(adminApi.put('/admin/home-sections-reorder', { order })),

  articles: () => unwrap(adminApi.get('/admin/articles')),
  article: (id) => unwrap(adminApi.get(`/admin/articles/${id}`)),
  createArticle: (data) => unwrap(adminApi.post('/admin/articles', data)),
  updateArticle: (id, data) => unwrap(adminApi.put(`/admin/articles/${id}`, data)),
  deleteArticle: (id) => unwrap(adminApi.delete(`/admin/articles/${id}`)),

  salesReport: (params) => unwrap(adminApi.get('/admin/reports/sales', { params })),
  topProducts: () => unwrap(adminApi.get('/admin/reports/top-products')),
  analyticsOverview: () => unwrap(adminApi.get('/admin/analytics/overview')),

  settings: () => unwrap(adminApi.get('/admin/settings')),
  updateSettings: (data) => unwrap(adminApi.put('/admin/settings', data)),
  changePassword: (data) => unwrap(adminApi.put('/admin/change-password', data)),
};
