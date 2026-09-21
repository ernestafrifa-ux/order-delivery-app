// In local dev this stays "/api" and rides the Vite proxy to localhost:4000
// (see vite.config.js). In production, set VITE_API_URL at build time to
// the deployed backend's URL (e.g. https://your-api.up.railway.app/api).
const BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "order_delivery_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Fired whenever a request comes back unauthenticated (missing/expired
// session), so the app can redirect to /login from one place.
export const AUTH_EVENT = "order-delivery-auth-required";

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401 && path !== "/auth/login") {
    clearToken();
    window.dispatchEvent(new Event(AUTH_EVENT));
    throw new Error("Not signed in");
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  login: async (username, password, rememberMe) => {
    const { token } = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, rememberMe }),
    });
    setToken(token);
    return token;
  },
  me: () => request("/auth/me"),
  logout: () => clearToken(),

  // Dashboard
  getDashboard: () => request("/dashboard"),

  // Customers
  getCustomers: () => request("/customers"),
  getCustomer: (id) => request(`/customers/${id}`),
  getCustomerOrders: (id) => request(`/customers/${id}/orders`),
  createCustomer: (data) => request("/customers", { method: "POST", body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: "DELETE" }),

  // Orders
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/orders${suffix}`);
  },
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request("/orders", { method: "POST", body: JSON.stringify(data) }),
  updateOrder: (id, data) => request(`/orders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: "DELETE" }),

  addItem: (orderId, item) => request(`/orders/${orderId}/items`, { method: "POST", body: JSON.stringify(item) }),
  updateItem: (orderId, itemId, item) =>
    request(`/orders/${orderId}/items/${itemId}`, { method: "PUT", body: JSON.stringify(item) }),
  deleteItem: (orderId, itemId) => request(`/orders/${orderId}/items/${itemId}`, { method: "DELETE" }),
};
