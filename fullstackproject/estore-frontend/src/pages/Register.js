import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/api";
import { useToast } from "../App";

function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "CUSTOMER", // Default role
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const update = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(form);
      toast("Account created! Please sign in.", "success");
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message || "This email is already registered.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-logo">◈ Élite Store</div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-sub">Join us and start shopping</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-6">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Jane"
                value={form.firstName}
                onChange={update("firstName")}
                required
              />
            </div>
            <div className="col-6">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Doe"
                value={form.lastName}
                onChange={update("lastName")}
                required
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={form.email}
              onChange={update("email")}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={update("password")}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Account Type</label>
            <select
              className="form-select"
              value={form.role}
              onChange={update("role")}
            >
              <option value="CUSTOMER">
                Customer - Browse and purchase products
              </option>
              <option value="SELLER">Seller - List and manage products</option>
            </select>
            <small
              style={{
                color: "var(--muted)",
                fontSize: "0.7rem",
                display: "block",
                marginTop: "0.25rem",
              }}
            >
              {form.role === "SELLER"
                ? "Sellers can create, edit, and delete their own products."
                : "Customers can browse products, add to cart, and place orders."}
            </small>
          </div>
          <button
            type="submit"
            className="btn-gold w-100"
            style={{ padding: "0.75rem" }}
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="auth-link-row">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
