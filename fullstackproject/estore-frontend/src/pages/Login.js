import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/api";
import { useToast } from "../App";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login({ email, password });
      console.log("Login response:", res.data); // Debug log

      const data = res.data;

      // Handle different response structures
      let token = null;
      let userData = null;

      // Check if response has nested user object
      if (data.user) {
        userData = data.user;
        token = data.token || data.accessToken;
      } else {
        userData = data;
        token = data.token || data.accessToken;
      }

      // Ensure userData has all required fields
      if (!userData.id && data.id) userData.id = data.id;
      if (!userData.firstName && data.firstName)
        userData.firstName = data.firstName;
      if (!userData.lastName && data.lastName)
        userData.lastName = data.lastName;
      if (!userData.email && data.email) userData.email = data.email;
      if (!userData.role && data.role) userData.role = data.role;

      // Set default role if not present
      if (!userData.role) {
        userData.role = "CUSTOMER";
      }

      // Store in localStorage
      if (token) {
        localStorage.setItem("token", token);
      }
      localStorage.setItem("user", JSON.stringify(userData));

      // Update state
      setUser(userData);

      console.log("Stored user data:", userData); // Debug log

      toast(
        `Welcome back, ${userData.firstName || userData.email}!`,
        "success",
      );

      // Redirect based on role
      if (userData.role === "SELLER" || userData.role === "ADMIN") {
        navigate("/seller/dashboard");
      } else {
        navigate("/products");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-logo">◈ Élite Store</div>
        <h1 className="auth-title">Sign In</h1>
        <p className="auth-sub">Welcome back to your account</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-gold w-100"
            style={{ padding: "0.75rem" }}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="auth-link-row">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
