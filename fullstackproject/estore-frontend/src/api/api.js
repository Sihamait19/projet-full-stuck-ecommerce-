import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8082/api",
});

// ── Attach JWT to every request ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Safe user reader ─────────────────────────────────────────────
export const getUser = () => {
  try {
    const u = localStorage.getItem("user");
    return u && u !== "undefined" ? JSON.parse(u) : null;
  } catch {
    return null;
  }
};

export const isSeller = () => {
  const u = getUser();
  return u?.role === "SELLER" || u?.role === "seller" || u?.role === "ADMIN";
};

// ── AUTH ─────────────────────────────────────────────────────────
export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);

// ── CATALOG ──────────────────────────────────────────────────────
export const getProducts = () => api.get("/catalog/products");
export const getProduct = (id) => api.get(`/catalog/products/${id}`);
export const getCategories = () => api.get("/categories");

// ── REVIEWS (Fixed endpoints) ────────────────────────────────────
export const getProductReviews = (productId) =>
  api.get(`/reviews/product/${productId}`);

export const addReview = (reviewData) =>
  api.post("/reviews", {
    productId: reviewData.productId,
    userId: reviewData.userId,
    authorName: reviewData.userName,
    rating: reviewData.rating,
    comment: reviewData.comment,
  });

// ── SELLER: product management ────────────────────────────────────
export const createProduct = (data) => api.post("/catalog/products", data);
export const updateProduct = (id, data) =>
  api.put(`/catalog/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/catalog/products/${id}`);

// ── INVENTORY ────────────────────────────────────────────────────
export const getInventory = (productId) => api.get(`/inventory/${productId}`);
export const updateInventory = (productId, quantity) =>
  api.put(`/inventory/update?productId=${productId}&quantity=${quantity}`);

// ── CART ─────────────────────────────────────────────────────────
export const getCart = () => {
  const user = getUser();
  if (!user) return Promise.reject("Not logged in");
  return api.get(`/cart/${user.id}`);
};

export const addToCart = (productId, quantity) => {
  const user = getUser();
  if (!user) return Promise.reject("Not logged in");
  return api.post(
    `/cart/add?userId=${user.id}&productId=${productId}&quantity=${quantity}`,
  );
};

export const updateCartItem = (cartItemId, quantity) =>
  api.put(`/cart/update?cartItemId=${cartItemId}&quantity=${quantity}`);

export const removeCartItem = (itemId) => api.delete(`/cart/item/${itemId}`);

// ── ORDERS ───────────────────────────────────────────────────────
export const createOrder = () => {
  const user = getUser();
  if (!user) return Promise.reject("Not logged in");
  return api.post(`/orders/create/${user.id}`);
};

export const getOrders = () => {
  const user = getUser();
  if (!user) return Promise.reject("Not logged in");
  return api.get(`/orders/user/${user.id}`);
};

export const deleteOrder = (orderId) => api.delete(`/orders/${orderId}`);

// ── PROFILE ──────────────────────────────────────────────────────
export const getProfile = () => {
  const user = getUser();
  if (!user) return Promise.reject("Not logged in");
  return api.get(`/users/${user.id}`);
};

export default api;
