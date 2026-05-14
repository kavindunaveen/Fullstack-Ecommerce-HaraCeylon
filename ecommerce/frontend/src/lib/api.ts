/**
 * HARA Store — API Client
 * Centralised Axios instance with auth token injection.
 */
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Inject JWT access token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Auth token
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Guest session ID
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('session_id', sessionId);
    }
    config.headers['X-Session-ID'] = sessionId;

    const currency = localStorage.getItem('currency') || 'GBP';
    config.headers['X-Currency'] = currency;
    const language = localStorage.getItem('language') || 'en';
    config.headers['Accept-Language'] = language;
  }
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) {
          const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/account/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── API helpers ───────────────────────────────────────────────
export const productsApi = {
  list: (params?: object) => api.get('/products', { params }),
  detail: (slug: string) => api.get(`/products/${slug}`),
  featured: () => api.get('/products/featured/'),
  newArrivals: () => api.get('/products/new-arrivals/'),
  bestSellers: () => api.get('/products/best-sellers/'),
  related: (slug: string) => api.get(`/products/${slug}/related/`),
  reviews: (slug: string) => api.get(`/products/${slug}/reviews/`),
  addReview: (slug: string, data: object) => api.post(`/products/${slug}/reviews/add/`, data),
};

export const categoriesApi = {
  list: () => api.get('/products/categories/'),
  detail: (slug: string) => api.get(`/products/categories/${slug}/`),
};

export const brandsApi = {
  list: () => api.get('/products/brands/'),
};

export const cartApi = {
  get: () => api.get('/cart/'),
  add: (data: object) => api.post('/cart/add/', data),
  update: (itemId: string, data: object) => api.patch(`/cart/update/${itemId}/`, data),
  remove: (itemId: string) => api.delete(`/cart/remove/${itemId}/`),
  clear: () => api.delete('/cart/clear/'),
};

export const checkoutApi = {
  placeOrder: (data: object) => api.post('/orders/checkout/', data),
  getOrder: (orderNumber: string) => api.get(`/orders/${orderNumber}/`),
  validateCoupon: (data: object) => api.post('/coupons/validate/', data),
  getShippingRates: (country: string) => api.get(`/shipping/rates/?country=${country}`),
  initiatePayHere: (orderNumber: string) => api.get(`/payments/payhere/initiate/${orderNumber}/`),
};

export const accountApi = {
  getUser: () => api.get('/account/user/'),
  updateUser: (data: object) => api.patch('/account/user/', data),
  getProfile: () => api.get('/account/profile/'),
  updateProfile: (data: object) => api.patch('/account/profile/', data),
  getAddresses: () => api.get('/account/addresses/'),
  addAddress: (data: object) => api.post('/account/addresses/', data),
  updateAddress: (id: string, data: object) => api.patch(`/account/addresses/${id}/`, data),
  deleteAddress: (id: string) => api.delete(`/account/addresses/${id}/`),
  getOrders: () => api.get('/account/orders/'),
  getOrder: (orderNumber: string) => api.get(`/account/orders/${orderNumber}/`),
  getWishlist: () => api.get('/products/wishlist/'),
  addWishlist: (data: object) => api.post('/products/wishlist/', data),
  removeWishlist: (productId: string) => api.delete(`/products/wishlist/${productId}/remove/`),
};

export const authApi = {
  login: (data: object) => api.post('/auth/login/', data),
  register: (data: object) => api.post('/auth/registration/', data),
  logout: () => api.post('/auth/logout/'),
  forgotPassword: (data: object) => api.post('/auth/password/reset/', data),
  resetPassword: (data: object) => api.post('/auth/password/reset/confirm/', data),
};

export const currencyApi = {
  list: () => api.get('/products/currencies/'),
};

export const languageApi = {
  list: () => api.get('/products/languages/'),
};

export const pagesApi = {
  getPage: (slug: string) => api.get(`/pages/${slug}/`),
  submitContact: (data: object) => api.post('/pages/contact/submit/', data),
  subscribe: (data: object) => api.post('/account/newsletter/subscribe/', data),
};

export default api;
