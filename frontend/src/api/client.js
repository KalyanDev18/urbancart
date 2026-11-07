const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

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
