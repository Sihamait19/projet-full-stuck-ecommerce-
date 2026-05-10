import { Link, useLocation } from "react-router-dom";

function Navbar({ user, logout, isSeller }) {
  const loc = useLocation();
  const active = (path) => loc.pathname === path ? " active" : "";

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <span className="navbar-brand-icon">◈</span> Élite Store
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          style={{ color: "var(--muted2)" }}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <div className="navbar-nav ms-auto align-items-center gap-1">

            {/* Always visible */}
            <Link className={"nav-link" + active("/products")} to="/products">
              Shop
            </Link>

            {user ? (
              <>
                {isSeller ? (
                  /* ── SELLER NAV ── */
                  <>
                    <Link className={"nav-link" + active("/seller/dashboard")} to="/seller/dashboard">
                      My Products
                    </Link>
                    <Link className={"nav-link" + active("/profile")} to="/profile">
                      Profile
                    </Link>
                    <span className="nav-role-chip seller">Seller</span>
                    <span className="nav-user-greeting">— {user.firstName}</span>
                    <button className="btn-nav-logout ms-1" onClick={logout}>Logout</button>
                  </>
                ) : (
                  /* ── CUSTOMER NAV ── */
                  <>
                    <Link className={"nav-link" + active("/cart")} to="/cart">
                      Cart
                    </Link>
                    <Link className={"nav-link" + active("/orders")} to="/orders">
                      Orders
                    </Link>
                    <Link className={"nav-link" + active("/profile")} to="/profile">
                      Profile
                    </Link>
                    <span className="nav-role-chip customer">Customer</span>
                    <span className="nav-user-greeting">— {user.firstName}</span>
                    <button className="btn-nav-logout ms-1" onClick={logout}>Logout</button>
                  </>
                )}
              </>
            ) : (
              <>
                <Link className="btn-nav-login ms-2"    to="/login">Login</Link>
                <Link className="btn-nav-register ms-1" to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;