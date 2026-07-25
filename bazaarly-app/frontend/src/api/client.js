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

  // editable website text (Home / About pages)
  siteContent: () => unwrap(api.get('/content')),
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
  deleteBanner: (id) => unwrap(adminApi.delete(`/admin/banners/${id}`)),

  advertisements: () => unwrap(adminApi.get('/admin/advertisements')),
  createAd: (data) => unwrap(adminApi.post('/admin/advertisements', data)),
  deleteAd: (id) => unwrap(adminApi.delete(`/admin/advertisements/${id}`)),

  salesReport: (params) => unwrap(adminApi.get('/admin/reports/sales', { params })),
  topProducts: () => unwrap(adminApi.get('/admin/reports/top-products')),
  analyticsOverview: () => unwrap(adminApi.get('/admin/analytics/overview')),

  settings: () => unwrap(adminApi.get('/admin/settings')),
  updateSettings: (data) => unwrap(adminApi.put('/admin/settings', data)),
};
