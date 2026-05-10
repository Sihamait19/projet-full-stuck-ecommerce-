import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProfile, getUser } from "../api/api";

function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      // First, get user from localStorage directly
      const localUser = getUser();
      console.log("Local user data:", localUser); // Debug log
      console.log("Prop user data:", user); // Debug log

      // Use the most recent data available
      const userData = localUser || user;

      if (userData && userData.id) {
        setProfile(userData);
      }

      // Try to fetch fresh data from API
      try {
        const response = await getProfile();
        const profileData = response.data || response;
        console.log("API profile data:", profileData); // Debug log

        if (profileData && profileData.id) {
          setProfile(profileData);
          // Update localStorage with fresh data
          localStorage.setItem("user", JSON.stringify(profileData));
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        if (!userData) {
          setError("Unable to load profile. Please try logging in again.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
        Loading profile…
      </div>
    );
  }

  const data = profile || user;
  console.log("Final profile data to display:", data); // Debug log

  if (!data || !data.id) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h2 className="empty-title">Unable to load profile</h2>
          <p className="empty-text">Please try logging out and back in.</p>
          <Link to="/login" className="btn-gold">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const firstName = data.firstName || data.firstname || "";
  const lastName = data.lastName || data.lastname || "";
  const initials =
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  const role = (data.role || "CUSTOMER").toUpperCase();
  const isSeller = role === "SELLER" || role === "ADMIN";

  const fields = [
    { label: "First Name", value: firstName || "Not set" },
    { label: "Last Name", value: lastName || "Not set" },
    { label: "Email", value: data.email || "Not set" },
    { label: "Member ID", value: data.id ? `#${data.id}` : "Not set" },
    { label: "Account Type", value: isSeller ? "Seller" : "Customer" },
  ];

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1 className="page-title">
          My <span>Profile</span>
        </h1>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      <div className="profile-layout">
        <div className="profile-panel">
          <div className={`profile-avatar ${isSeller ? "seller-avatar" : ""}`}>
            {initials}
          </div>
          <div className="profile-name">
            {firstName} {lastName}
          </div>
          <div
            className={`profile-role-badge ${isSeller ? "seller" : "customer"}`}
          >
            {isSeller ? "⚙ Seller Account" : "🛍 Customer Account"}
          </div>

          <div className="profile-fields">
            {fields.map((f) => (
              <div className="profile-field" key={f.label}>
                <span className="profile-field-label">{f.label}</span>
                <span className="profile-field-value">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-actions">
          <h3 className="profile-actions-title">Quick Actions</h3>

          {isSeller ? (
            <>
              <Link
                to="/seller/dashboard"
                className="profile-action-card seller-action"
              >
                <div className="action-icon">📦</div>
                <div>
                  <div className="action-title">My Products</div>
                  <div className="action-sub">Manage your listings</div>
                </div>
                <span className="action-arrow">→</span>
              </Link>
              <Link to="/products" className="profile-action-card">
                <div className="action-icon">🛍</div>
                <div>
                  <div className="action-title">Browse Shop</div>
                  <div className="action-sub">See the storefront</div>
                </div>
                <span className="action-arrow">→</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/cart" className="profile-action-card">
                <div className="action-icon">🛒</div>
                <div>
                  <div className="action-title">My Cart</div>
                  <div className="action-sub">View items ready to order</div>
                </div>
                <span className="action-arrow">→</span>
              </Link>
              <Link to="/orders" className="profile-action-card">
                <div className="action-icon">📋</div>
                <div>
                  <div className="action-title">Order History</div>
                  <div className="action-sub">Track your past purchases</div>
                </div>
                <span className="action-arrow">→</span>
              </Link>
              <Link to="/products" className="profile-action-card">
                <div className="action-icon">✨</div>
                <div>
                  <div className="action-title">Shop Now</div>
                  <div className="action-sub">Browse our collection</div>
                </div>
                <span className="action-arrow">→</span>
              </Link>
            </>
          )}

          <div className="profile-role-info">
            {isSeller ? (
              <>
                <strong>✨ Seller Benefits</strong>
                <p>
                  ✓ Create and manage your own product listings
                  <br />
                  ✓ Track inventory and update stock levels
                  <br />
                  ✓ Reach customers directly through our marketplace
                  <br />✓ Edit product details anytime
                </p>
              </>
            ) : (
              <>
                <strong>🛒 Customer Benefits</strong>
                <p>
                  ✓ Browse our curated collection of products
                  <br />
                  ✓ Add items to cart and place orders securely
                  <br />
                  ✓ View your complete order history
                  <br />✓ Leave reviews on products you've purchased
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
