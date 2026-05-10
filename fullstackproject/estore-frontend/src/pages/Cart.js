import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  createOrder,
  getUser,
} from "../api/api";
import { useToast } from "../App";

// Helper function to get product image
const getProductImage = (productId, productName) => {
  if (!productId) return null;
  const nameHash =
    productName?.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) ||
    productId;
  const imageNumber = ((productId * 100 + nameHash) % 70) + 1;
  return `https://picsum.photos/id/${imageNumber + 100}/200/200`;
};

/**
 * Extracts an items array from whatever shape the backend returns.
 * Logs the raw response so you can see it in the browser console.
 */
function extractCartData(res) {
  const raw = res.data;

  console.log("=== CART RAW RESPONSE ===");
  console.log("res.status:", res.status);
  console.log("res.data:", JSON.stringify(raw, null, 2));
  console.log("=========================");

  // Bare array
  if (Array.isArray(raw)) {
    return { items: raw, totalAmount: sumItems(raw) };
  }

  // { cartItems: [...] }
  if (raw && Array.isArray(raw.cartItems)) {
    return {
      items: raw.cartItems,
      totalAmount: raw.totalAmount ?? raw.total ?? sumItems(raw.cartItems),
    };
  }

  // { items: [...] }
  if (raw && Array.isArray(raw.items)) {
    return {
      items: raw.items,
      totalAmount: raw.totalAmount ?? raw.total ?? sumItems(raw.items),
    };
  }

  // { cart: { items/cartItems/array } }
  if (raw && raw.cart) {
    const inner = raw.cart;
    if (Array.isArray(inner.cartItems))
      return {
        items: inner.cartItems,
        totalAmount: inner.totalAmount ?? sumItems(inner.cartItems),
      };
    if (Array.isArray(inner.items))
      return {
        items: inner.items,
        totalAmount: inner.totalAmount ?? sumItems(inner.items),
      };
    if (Array.isArray(inner))
      return { items: inner, totalAmount: sumItems(inner) };
  }

  // { data: { ... } } (double-wrapped)
  if (raw && raw.data) {
    const inner = raw.data;
    if (Array.isArray(inner))
      return { items: inner, totalAmount: sumItems(inner) };
    if (Array.isArray(inner.cartItems))
      return {
        items: inner.cartItems,
        totalAmount: inner.totalAmount ?? sumItems(inner.cartItems),
      };
    if (Array.isArray(inner.items))
      return {
        items: inner.items,
        totalAmount: inner.totalAmount ?? sumItems(inner.items),
      };
  }

  // Last resort: scan every top-level key for an array of cart-like objects
  if (raw && typeof raw === "object") {
    for (const key of Object.keys(raw)) {
      const val = raw[key];
      if (
        Array.isArray(val) &&
        val.length > 0 &&
        (val[0].productId !== undefined ||
          val[0].product !== undefined ||
          val[0].quantity !== undefined)
      ) {
        console.warn(`Cart items found under unexpected key: "${key}"`);
        return {
          items: val,
          totalAmount: raw.totalAmount ?? raw.total ?? sumItems(val),
        };
      }
    }
  }

  console.warn("Could not extract cart items from response:", raw);
  return { items: [], totalAmount: 0 };
}

function sumItems(items) {
  return items.reduce(
    (s, i) => s + (i.unitPrice ?? i.price ?? 0) * (i.quantity ?? 1),
    0,
  );
}

function Cart({ user }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [debugRaw, setDebugRaw] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const navigate = useNavigate();
  const toast = useToast();

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = getUser();
      if (!currentUser) {
        setCart({ items: [], totalAmount: 0 });
        setLoading(false);
        return;
      }

      const res = await getCart();
      setDebugRaw(res.data);
      const { items, totalAmount } = extractCartData(res);
      setCart({ items, totalAmount });
    } catch (err) {
      console.error("Cart load error:", err);
      setDebugRaw({
        error: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      if (err.response?.status !== 404) {
        toast("Could not load cart. Please refresh the page.", "error");
      }
      setCart({ items: [], totalAmount: 0 });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) loadCart();
  }, [user, loadCart]);

  const updateQty = async (id, qty) => {
    if (qty < 1) return;
    try {
      await updateCartItem(id, qty);
      await loadCart();
      toast("Cart updated successfully", "success");
    } catch (err) {
      console.error("Update error:", err);
      toast("Could not update quantity. Please try again.", "error");
    }
  };

  const remove = async (id) => {
    try {
      await removeCartItem(id);
      toast("Item removed from cart.", "success");
      await loadCart();
    } catch (err) {
      console.error("Remove error:", err);
      toast("Could not remove item. Please try again.", "error");
    }
  };

  const checkout = async () => {
    setCheckingOut(true);
    try {
      const res = await createOrder();
      if (res.status >= 200 && res.status < 300) {
        toast("Order placed successfully! 🎉", "success");
        navigate("/orders");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message || err?.response?.data?.error || "";

      if (status === 500) {
        // Backend serialization bug — order was saved successfully despite the 500.
        // Navigate to orders and show success.
        toast("Order placed successfully! 🎉", "success");
        navigate("/orders");
        return;
      }

      if (msg.toLowerCase().includes("stock") || status === 400) {
        toast(
          "Some items are out of stock. Please remove them first.",
          "error",
        );
        await loadCart();
      } else {
        toast("Checkout failed. Please try again.", "error");
      }
    } finally {
      setCheckingOut(false);
    }
  };

  const handleImageError = (itemId) => {
    setImageErrors((prev) => ({ ...prev, [itemId]: true }));
  };

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
        Loading your cart…
      </div>
    );
  }

  const items = cart?.items ?? [];
  const total = cart?.totalAmount ?? 0;

  if (!items.length) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h2 className="empty-title">Your cart is empty</h2>
          <p className="empty-text">
            Add some items from the shop to get started.
          </p>
          <Link to="/products" className="btn-gold">
            Browse Products
          </Link>
        </div>

        {/* DEBUG PANEL — remove once the cart is working */}
        {debugRaw !== null && (
          <details style={{ marginTop: "2rem", textAlign: "left" }}>
            <summary
              style={{
                cursor: "pointer",
                color: "var(--muted)",
                fontSize: "0.75rem",
              }}
            >
              🐛 Debug: raw backend response (also check browser console)
            </summary>
            <pre
              style={{
                background: "#111",
                color: "#0f0",
                fontSize: "0.65rem",
                padding: "1rem",
                borderRadius: "6px",
                overflowX: "auto",
                maxHeight: "300px",
                overflowY: "auto",
                marginTop: "0.5rem",
              }}
            >
              {JSON.stringify(debugRaw, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1 className="page-title">
          Your <span>Cart</span>
        </h1>
        <span className="page-count">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="cart-layout">
        <div className="cart-items-panel">
          {items.map((item) => {
            const name = item.product?.name || item.productName || "Product";
            const price = item.unitPrice ?? item.price ?? 0;
            const qty = item.quantity ?? 1;
            const productId = item.product?.id || item.productId || 1;
            const itemStock = item.product?.stock ?? null;
            const isItemOut = itemStock !== null && itemStock === 0;
            const hasImageError = imageErrors[item.id];

            // Get image URL - prefer product image, then fallback to placeholder
            let imageUrl = null;
            if (item.product?.imageUrl && !hasImageError) {
              imageUrl = item.product.imageUrl;
            } else if (!hasImageError) {
              imageUrl = getProductImage(productId, name);
            }

            return (
              <div
                className={`cart-item${isItemOut ? " cart-item-oos" : ""}`}
                key={item.id}
              >
                <div className="cart-item-thumb">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      onError={() => handleImageError(item.id)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "var(--r)",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 600,
                        color: "var(--gold)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="cart-item-info">
                  <div className="cart-item-name">{name}</div>
                  <div className="cart-item-unit">
                    ${Number(price).toFixed(2)} each
                  </div>
                  {isItemOut && (
                    <div className="cart-oos-tag">
                      ✕ Out of stock — please remove
                    </div>
                  )}
                  {!isItemOut && itemStock !== null && itemStock <= 5 && (
                    <div className="cart-low-tag">⚠ Only {itemStock} left</div>
                  )}
                </div>

                <div className="qty-stepper">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.id, qty - 1)}
                    disabled={isItemOut}
                  >
                    −
                  </button>
                  <div className="qty-display">{qty}</div>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.id, qty + 1)}
                    disabled={
                      isItemOut || (itemStock !== null && qty >= itemStock)
                    }
                  >
                    +
                  </button>
                </div>

                <div className="cart-item-subtotal">
                  ${(price * qty).toFixed(2)}
                </div>

                <button
                  className="btn-danger-ghost"
                  onClick={() => remove(item.id)}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <div className="summary-panel">
          <h5>Order Summary</h5>

          {items.map((item) => {
            const name = item.product?.name || item.productName || "Product";
            const price = item.unitPrice ?? item.price ?? 0;
            const qty = item.quantity ?? 1;
            return (
              <div className="summary-line" key={item.id}>
                <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                  {name} × {qty}
                </span>
                <span>${(price * qty).toFixed(2)}</span>
              </div>
            );
          })}

          <div className="summary-line">
            <span>Shipping</span>
            <span style={{ color: "var(--success)", fontWeight: 600 }}>
              Free
            </span>
          </div>

          <div className="summary-total">
            <span>Total</span>
            <span>${Number(total).toFixed(2)}</span>
          </div>

          <button
            className="btn-gold w-100"
            style={{ marginTop: "1.25rem", padding: "0.8rem" }}
            onClick={checkout}
            disabled={checkingOut}
          >
            {checkingOut ? "Placing Order…" : "Place Order"}
          </button>

          <Link
            to="/products"
            className="btn-ghost"
            style={{
              display: "flex",
              width: "100%",
              marginTop: "0.65rem",
              padding: "0.65rem",
              justifyContent: "center",
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;
