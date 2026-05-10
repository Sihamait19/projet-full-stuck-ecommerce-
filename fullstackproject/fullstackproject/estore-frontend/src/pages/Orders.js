import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders, deleteOrder } from "../api/api";
import { useToast } from "../App";

function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null); // order being deleted
  const [confirmId, setConfirmId] = useState(null); // confirm-dialog order id
  const toast = useToast();

  const loadOrders = () => {
    if (!user) return;
    setLoading(true);
    getOrders()
      .then((res) => setOrders(res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const handleDelete = async (orderId) => {
    setDeletingId(orderId);
    try {
      await deleteOrder(orderId);
      toast("Order deleted.", "success");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("Delete order error:", err);
      toast("Could not delete order. Please try again.", "error");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
        Loading your orders…
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2 className="empty-title">No orders yet</h2>
          <p className="empty-text">
            Your order history will appear here once you make a purchase.
          </p>
          <Link to="/products" className="btn-gold">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      {/* ── Confirm Delete Dialog ── */}
      {confirmId && (
        <div className="modal-overlay" onClick={() => setConfirmId(null)}>
          <div
            className="modal-box confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Delete Order</h3>
              <button
                className="modal-close"
                onClick={() => setConfirmId(null)}
              >
                ✕
              </button>
            </div>
            <p style={{ color: "var(--muted2)", marginBottom: "1.5rem" }}>
              Are you sure you want to delete Order #{confirmId}? This cannot be
              undone.
            </p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setConfirmId(null)}>
                Cancel
              </button>
              <button
                className="btn-danger-ghost"
                style={{
                  background: "var(--danger)",
                  color: "white",
                  padding: "0.6rem 1.4rem",
                }}
                onClick={() => handleDelete(confirmId)}
                disabled={deletingId === confirmId}
              >
                {deletingId === confirmId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">
            Order <span>History</span>
          </h1>
        </div>
        <span className="page-count">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </span>
      </div>

      {orders.map((order) => {
        const items = order.items || order.orderItems || [];
        const total = order.totalAmount ?? order.total ?? 0;
        const date = order.orderDate || order.createdAt || order.date;

        return (
          <div className="order-card" key={order.id}>
            <div className="order-head">
              <div>
                <div className="order-id-label">Order #{order.id}</div>
                <div className="order-date-label">
                  {date
                    ? new Date(date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <span className="order-status-chip">
                  {order.status || "Confirmed"}
                </span>
                <span className="order-total-label">
                  ${Number(total).toFixed(2)}
                </span>
                <button
                  className="btn-danger-ghost"
                  style={{ fontSize: "0.72rem", padding: "0.3rem 0.75rem" }}
                  onClick={() => setConfirmId(order.id)}
                  disabled={deletingId === order.id}
                >
                  {deletingId === order.id ? "…" : "✕ Delete"}
                </button>
              </div>
            </div>

            {items.length > 0 && (
              <table className="order-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const name =
                      item.product?.name ||
                      item.productName ||
                      `Item ${idx + 1}`;
                    const price = item.unitPrice ?? item.price ?? 0;
                    const qty = item.quantity ?? 1;
                    return (
                      <tr key={item.id || idx}>
                        <td>{name}</td>
                        <td style={{ color: "var(--muted)" }}>{qty}</td>
                        <td style={{ color: "var(--muted)" }}>
                          ${Number(price).toFixed(2)}
                        </td>
                        <td
                          style={{ textAlign: "right", color: "var(--gold)" }}
                        >
                          ${(price * qty).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Orders;
