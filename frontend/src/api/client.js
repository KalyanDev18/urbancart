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

async function request(url, options = {}) {
  const finalUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const response = await fetch(finalUrl, {
    ...options,
    headers: {
      ...getHeaders(options.includeAuth !== false),
      ...(options.headers || {}),
    },
  });

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
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/products/${query ? '?' + query : ''}`);
  },
  getSections: () => request('/api/products/sections/'),
  getCategories: () => request('/api/categories/'),

  // Auth
  sendOtp: (email) => request('/api/auth/send-otp/', {
    method: 'POST',
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

  // Saved Addresses
  getAddresses: () => request('/api/addresses/'),
  addAddress: (data) => request('/api/addresses/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteAddress: (id) => request(`/api/addresses/${id}/`, {
    method: 'DELETE',
  }),

  // AI Chatbot
  askChatbot: (message) => request('/api/chatbot/', {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),
};
