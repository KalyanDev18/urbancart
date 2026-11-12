const RAW_API_URL = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');
export const HAS_BACKEND_URL =
  Boolean(API_BASE_URL) ||
  (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

function getHeaders(includeAuth = true) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (includeAuth) {
    const token = localStorage.getItem('urbancart_token');
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }
  return headers;
}

export function optimizeImageUrl(url, width = 360) {
  const fallback = `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=${width}&auto=format&fit=crop&q=70`;
  if (!url || typeof url !== 'string') return fallback;
  if (url.includes('images.unsplash.com')) {
    const clean = url.split('?')[0];
    return `${clean}?auto=format&fit=crop&w=${width}&q=70`;
  }
  return url;
}

const HOME_CACHE_KEY = 'urbancart_home_cache_v2';

export function getCachedHome() {
  try {
    const raw = localStorage.getItem(HOME_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) return parsed;
  } catch {
    // Ignore storage errors
  }
  return null;
}

export function setCachedHome(data) {
  try {
    if (data && Array.isArray(data.products) && data.products.length > 0) {
      localStorage.setItem(HOME_CACHE_KEY, JSON.stringify({ ...data, _cachedAt: Date.now() }));
    }
  } catch {
    // Ignore quota errors
  }
}

let inflightHomeRequest = null;

async function request(url, options = {}) {
  const finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const controller = new AbortController();
  const timeoutMs = options.timeout || 25000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(finalUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        ...getHeaders(options.includeAuth !== false),
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Server took too long to respond. Please try again in a few seconds.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const rawText = await response.text().catch(() => '');
    const err = new Error(
      !HAS_BACKEND_URL
        ? 'Backend API URL (VITE_API_URL) is not set in Vercel Environment Variables.'
        : `Server returned ${contentType || 'non-JSON'} (status ${response.status}). Backend may still be waking up.`
    );
    err.status = response.status;
    err.data = rawText;
    throw err;
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data && data.error ? data.error : (data && data.message ? data.message : `Request failed with status ${response.status}`);
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Catalog
  getHomeData: () => {
    if (inflightHomeRequest) return inflightHomeRequest;
    inflightHomeRequest = request('/api/products/home/', { timeout: 45000 }).finally(() => {
      inflightHomeRequest = null;
    });
    return inflightHomeRequest;
  },
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/products/${query ? '?' + query : ''}`, { timeout: 45000 });
  },
  getSections: () => request('/api/products/sections/', { timeout: 45000 }),
  getCategories: () => request('/api/categories/'),

  // Auth
  sendOtp: (email) => request('/api/auth/send-otp/', {
    method: 'POST',
    timeout: 15000,
    body: JSON.stringify({ email }),
  }),
  verifyOtp: (email, otp) => request('/api/auth/verify-otp/', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  }),
  login: (username, password) => request('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  googleLogin: (email = '', name = '') => request('/api/auth/google/', {
    method: 'POST',
    body: JSON.stringify({ email, name }),
  }),
  register: (payload) => request('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getMe: () => request('/api/auth/me/'),
  updateProfile: (data) => request('/api/auth/me/', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  logout: () => request('/api/auth/logout/', {
    method: 'POST',
  }),

  // Cart
  getCart: () => request('/api/cart/'),
  addToCart: (productId, quantity = 1) => request('/api/cart/add/', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  }),
  updateCartQuantity: (itemId, delta) => request('/api/cart/update/', {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId, delta }),
  }),
  removeFromCart: (itemId) => request(`/api/cart/item/${itemId}/`, {
    method: 'DELETE',
  }),
  clearCart: () => request('/api/cart/clear/', {
    method: 'POST',
  }),

  // Checkout & Orders
  checkout: (payload) => request('/api/checkout/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getMyOrders: () => request('/api/orders/my-orders/'),
  getOrderDetail: (orderId) => request(`/api/orders/${orderId}/`),
  getOrderInvoice: (orderId) => request(`/api/orders/${orderId}/invoice/`),
  cancelOrder: (orderId, reason) => request(`/api/orders/${orderId}/cancel/`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  returnOrder: (orderId, payload) => request(`/api/orders/${orderId}/return/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Saved Addresses
  getAddresses: () => request('/api/addresses/'),
  addAddress: (data) => request('/api/addresses/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteAddress: (id) => request(`/api/addresses/${id}/`, {
    method: 'DELETE',
  }),

  // AI Chatbot & Support Tickets
  askChatbot: (message) => request('/api/chatbot/', {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
  getSupportTickets: () => request('/api/support/tickets/'),
  createSupportTicket: (data) => request('/api/support/tickets/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Admin Control Center (Staff Only)
  getAdminOverview: () => request('/api/admin/overview/'),
  adminUpdateOrder: (orderId, data) => request(`/api/admin/orders/${orderId}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  adminCreateProduct: (data) => request('/api/admin/products/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  adminUpdateProduct: (productId, data) => request(`/api/admin/products/${productId}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  adminDeleteProduct: (productId) => request(`/api/admin/products/${productId}/`, {
    method: 'DELETE',
  }),
  adminUpdateTicket: (ticketId, data) => request(`/api/admin/tickets/${ticketId}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  // Product Reviews & Ratings
  getProductReviews: (productId) => request(`/api/products/${productId}/reviews/`),
  submitProductReview: (productId, data) => request(`/api/products/${productId}/reviews/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteProductReview: (productId, reviewId) => request(`/api/products/${productId}/reviews/${reviewId}/`, {
    method: 'DELETE',
  }),
};
