import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import SellerDashboard from "./pages/SellerDashboard";
import { getUser } from "./api/api";
import "./index.css";

// ── Toast Context ──────────────────────────────────────────────────────────
export const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500,
    );
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-msg ${t.type}`}>
            <span>{t.type === "success" ? "✓" : "✕"}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ── App ────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load user from localStorage on app start
    const loadUser = () => {
      try {
        const userData = getUser();
        console.log("Loaded user from localStorage:", userData);
        if (userData && userData.id) {
          setUser(userData);
        } else {
          // Clear invalid data
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Error loading user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    };

    loadUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const role = user?.role?.toUpperCase();
  const isSeller = role === "SELLER" || role === "ADMIN";

  console.log("Current user state:", user); // Debug log

  return (
    <BrowserRouter>
      <ToastProvider>
        <Navbar user={user} logout={logout} isSeller={isSeller} />
        <Routes>
          <Route path="/" element={<Navigate to="/products" />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products user={user} />} />
          <Route path="/product/:id" element={<ProductDetail user={user} />} />

          <Route
            path="/cart"
            element={
              <PrivateRoute user={user}>
                <Cart user={user} />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute user={user}>
                <Orders user={user} />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute user={user}>
                <Profile user={user} />
              </PrivateRoute>
            }
          />

          <Route
            path="/seller/dashboard"
            element={
              <PrivateRoute user={user}>
                <SellerDashboard user={user} />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/products" />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
