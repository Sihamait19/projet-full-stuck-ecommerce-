// ProductDetail.js - Updated
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getProduct,
  addToCart,
  getProductReviews,
  addReview,
  getInventory,
} from "../api/api";
import { useToast } from "../App";

const getProductImage = (productId, productName) => {
  const nameHash = productName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageNumber = ((productId * 100 + nameHash) % 70) + 1;
  return `https://picsum.photos/id/${imageNumber + 100}/800/800`;
};

const getStock = (product) => {
  if (product?.stock !== undefined && product?.stock !== null) {
    return Number(product.stock);
  }
  return null;
};

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "0.25rem" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            fontSize: "1.4rem",
            cursor: onChange ? "pointer" : "default",
            color: n <= (hovered || value) ? "var(--gold)" : "var(--border2)",
            transition: "color 0.15s",
            userSelect: "none",
          }}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange && onChange(n)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ProductDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const productRes = await getProduct(id);
        let productData = productRes.data;

        try {
          const inventoryRes = await getInventory(id);
          if (inventoryRes.data && inventoryRes.data.quantity !== undefined) {
            productData = {
              ...productData,
              stock: inventoryRes.data.quantity,
            };
          }
        } catch (inventoryError) {
          console.log("No inventory found for this product", inventoryError);
          productData.stock = null;
        }

        setProduct(productData);
        setImageError(false);

        try {
          const reviewsRes = await getProductReviews(id);
          setReviews(reviewsRes.data || []);
        } catch (reviewError) {
          console.error("Error fetching reviews:", reviewError);
          setReviews([]);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast("Could not load product details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id, toast]);

  const loadReviews = async () => {
    try {
      const reviewsRes = await getProductReviews(id);
      setReviews(reviewsRes.data || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const stock = getStock(product);

    if (stock !== null && stock === 0) {
      toast("This product is out of stock.", "error");
      return;
    }

    if (stock !== null && quantity > stock) {
      toast(`Only ${stock} items available.`, "error");
      return;
    }

    setAdding(true);
    setAddMsg(null);
    try {
      await addToCart(product.id, parseInt(quantity, 10));
      setAddMsg("success");
      toast(`${product.name} added to cart! 🛒`, "success");
      setTimeout(() => setAddMsg(null), 4000);
    } catch (err) {
      console.error("Add to cart error:", err);
      const msg =
        err?.response?.data?.message || err?.response?.data?.error || "";
      if (
        msg.toLowerCase().includes("stock") ||
        err?.response?.status === 400
      ) {
        toast("Not enough stock available.", "error");
      } else {
        toast("Could not add to cart. Please try again.", "error");
      }
      setAddMsg("error");
      setTimeout(() => setAddMsg(null), 4000);
    } finally {
      setAdding(false);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast("Please login to leave a review", "error");
      return;
    }

    setSubmitting(true);
    try {
      await addReview({
        productId: parseInt(id),
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        rating: newReview.rating,
        comment: newReview.comment,
      });
      setNewReview({ rating: 5, comment: "" });
      setShowForm(false);
      await loadReviews();
      toast("Review submitted! Thank you for your feedback.", "success");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast("Could not submit review. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrap" style={{ minHeight: "60vh" }}>
        <div className="spinner" />
        Loading product…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-wrap">
        <div className="empty-state">
          <div className="empty-icon">😕</div>
          <h2 className="empty-title">Product not found</h2>
          <p className="empty-text">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/products" className="btn-gold">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const stock = getStock(product);
  const isOutOfStock = stock !== null && stock === 0;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const productImage =
    product.imageUrl && !imageError
      ? product.imageUrl
      : getProductImage(product.id, product.name);

  return (
    <div className="page-wrap">
      <div className="breadcrumb-row">
        <Link to="/products">Shop</Link>
        <span className="breadcrumb-sep">/</span>
        {product.category && (
          <>
            <Link to={`/products?category=${product.category.id}`}>
              {product.category.name}
            </Link>
            <span className="breadcrumb-sep">/</span>
          </>
        )}
        <span>{product.name}</span>
      </div>

      <div className="detail-layout">
        <div className="detail-img-box">
          <img
            src={productImage}
            alt={product.name}
            onError={() => setImageError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "inherit",
            }}
          />
        </div>

        <div>
          {product.category?.name && (
            <div className="detail-cat">{product.category.name}</div>
          )}
          <h1 className="detail-title">{product.name}</h1>

          {avgRating && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginBottom: "0.75rem",
              }}
            >
              <StarPicker value={Math.round(parseFloat(avgRating))} />
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                {avgRating} ({reviews.length} review
                {reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          <div className="detail-price">
            ${Number(product.price).toFixed(2)}
          </div>

          {product.description && (
            <p className="detail-desc">{product.description}</p>
          )}

          {stock !== null && (
            <div
              className={`stock-pill ${isOutOfStock ? "out" : stock <= 5 ? "low" : "ok"}`}
            >
              {isOutOfStock
                ? "✕ Out of stock"
                : stock <= 5
                  ? `⚠ Only ${stock} left in stock`
                  : `✓ In stock (${stock} available)`}
            </div>
          )}

          {stock === null && (
            <div className="stock-pill ok">✓ Available for purchase</div>
          )}

          {isOutOfStock ? (
            <button
              className="btn-gold w-100"
              disabled
              style={{
                marginTop: "1.5rem",
                padding: "0.75rem",
                opacity: 0.45,
                cursor: "not-allowed",
              }}
            >
              Out of Stock
            </button>
          ) : (
            <>
              <div
                className="qty-add-row"
                style={{ marginTop: stock !== null ? "0" : "1.5rem" }}
              >
                <div className="qty-stepper">
                  <button
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={adding}
                  >
                    −
                  </button>
                  <div className="qty-display">{quantity}</div>
                  <button
                    className="qty-btn"
                    onClick={() =>
                      setQuantity((q) =>
                        stock !== null ? Math.min(stock, q + 1) : q + 1,
                      )
                    }
                    disabled={adding || (stock !== null && quantity >= stock)}
                  >
                    +
                  </button>
                </div>
                <button
                  className="btn-gold"
                  style={{ flex: 1 }}
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  {adding ? "Adding…" : "Add to Cart"}
                </button>
              </div>

              {addMsg === "success" && (
                <div
                  className="alert alert-success"
                  style={{ marginTop: "0.75rem" }}
                >
                  ✓ Added to cart!{" "}
                  <Link
                    to="/cart"
                    style={{
                      color: "inherit",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    View Cart →
                  </Link>
                </div>
              )}
              {addMsg === "error" && (
                <div
                  className="alert alert-danger"
                  style={{ marginTop: "0.75rem" }}
                >
                  ✕ Could not add to cart. Please try again.
                </div>
              )}
            </>
          )}

          {!user && !isOutOfStock && (
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--muted)",
                marginTop: "0.75rem",
              }}
            >
              <Link
                to="/login"
                style={{ color: "var(--gold)", fontWeight: 500 }}
              >
                Sign in
              </Link>{" "}
              to add items to your cart.
            </p>
          )}
        </div>
      </div>

      <div className="reviews-section">
        <div className="reviews-header">
          <h2 className="reviews-title">
            Customer Reviews{reviews.length > 0 ? ` (${reviews.length})` : ""}
          </h2>
          {user && (
            <button
              className="btn-ghost"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Cancel" : "Write a Review"}
            </button>
          )}
        </div>

        {showForm && (
          <div className="review-form-box" style={{ marginBottom: "2rem" }}>
            <h4>Share Your Experience</h4>
            <form onSubmit={handleAddReview}>
              <div className="mb-3">
                <label className="form-label">Rating</label>
                <StarPicker
                  value={newReview.rating}
                  onChange={(n) => setNewReview({ ...newReview, rating: n })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Your Review</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="What do you think about this product? Share your experience..."
                  value={newReview.comment}
                  onChange={(e) =>
                    setNewReview({ ...newReview, comment: e.target.value })
                  }
                  required
                />
              </div>
              <button type="submit" className="btn-gold" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Review"}
              </button>
            </form>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem" }}>
            <div className="empty-icon">📝</div>
            <p
              style={{
                color: "var(--muted)",
                fontStyle: "italic",
                fontSize: "0.9rem",
              }}
            >
              No reviews yet. Be the first to review this product!
            </p>
          </div>
        ) : (
          reviews.map((r, i) => (
            <div className="review-item" key={r.id || i}>
              <div className="review-author">
                {r.authorName || r.userName || r.author || "Anonymous"}
              </div>
              <div className="review-stars">
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </div>
              <p className="review-comment">{r.comment}</p>
              {r.createdAt && (
                <small style={{ color: "var(--muted)", fontSize: "0.7rem" }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </small>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProductDetail;
