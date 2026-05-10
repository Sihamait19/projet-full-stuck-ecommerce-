// Products.js - Updated
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProducts, getCategories, getInventory } from "../api/api";

// Helper function to get product image - uses product name to generate a themed placeholder image
const getProductImage = (productId, productName) => {
  // Use UI Faces for product images based on product name hash
  const nameHash = productName
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageNumber = ((productId * 100 + nameHash) % 70) + 1; // 1-70
  return `https://picsum.photos/id/${imageNumber + 100}/400/400`;
};

function StockBadge({ stock }) {
  if (stock === null) return null;
  if (stock === 0)
    return <div className="product-stock out-of-stock-tag">✕ Out of stock</div>;
  if (stock <= 5)
    return (
      <div className="product-stock" style={{ color: "var(--gold)" }}>
        ⚠ Only {stock} left
      </div>
    );
  return (
    <div className="product-stock" style={{ color: "var(--success)" }}>
      ✓ In stock ({stock})
    </div>
  );
}

function Products({ user }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [inventoryMap, setInventoryMap] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();

  // Load products and categories
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const productsRes = await getProducts();
        const productsData = productsRes.data || [];
        setProducts(productsData);

        try {
          const categoriesRes = await getCategories();
          setCategories(categoriesRes.data || []);
        } catch (error) {
          console.error("Error loading categories:", error);
          setCategories([]);
        }

        const inventoryPromises = productsData.map(async (product) => {
          try {
            const inventoryRes = await getInventory(product.id);
            return { productId: product.id, stock: inventoryRes.data.quantity };
          } catch (error) {
            return { productId: product.id, stock: null };
          }
        });

        const inventoryResults = await Promise.all(inventoryPromises);
        const inventoryMapData = {};
        inventoryResults.forEach((result) => {
          if (result.stock !== null) {
            inventoryMapData[result.productId] = result.stock;
          }
        });
        setInventoryMap(inventoryMapData);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const catParam = searchParams.get("category");
    if (catParam) {
      setCategory(catParam);
    }
  }, [searchParams]);

  const handleImageError = (productId) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !category || String(p.category?.id) === category;

    return matchesSearch && matchesCategory;
  });

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setSearchParams({});
  };

  return (
    <div className="page-wrap">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Our <span>Collection</span>
          </h1>
          {!loading && (
            <p
              className="page-count"
              style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
            >
              Discover our curated selection of premium products
            </p>
          )}
        </div>
        <span className="page-count">
          {filtered.length} / {products.length} products
        </span>
      </div>

      <div className="search-row">
        <div className="search-field">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="form-control"
            placeholder="Search products by name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ maxWidth: 220 }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {(search || category) && (
          <button className="btn-ghost" onClick={handleClearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
          Loading products…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2 className="empty-title">No products found</h2>
          <p className="empty-text">
            We couldn't find any products matching your criteria.
          </p>
          <button className="btn-ghost" onClick={handleClearFilters}>
            Browse All Products
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((p) => {
            const stock =
              inventoryMap[p.id] !== undefined ? inventoryMap[p.id] : null;
            const isOut = stock !== null && stock === 0;
            const hasImageError = imageErrors[p.id];
            const imageUrl = p.imageUrl || getProductImage(p.id, p.name);

            return (
              <div
                className={`e-card product-card${isOut ? " sold-out" : ""}`}
                key={p.id}
              >
                <div className="product-card-img">
                  {!hasImageError ? (
                    <img
                      src={imageUrl}
                      alt={p.name}
                      onError={() => handleImageError(p.id)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "inherit",
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "linear-gradient(135deg, var(--surface2), var(--surface))",
                        fontSize: "3rem",
                        fontWeight: 600,
                        color: "var(--gold)",
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isOut && (
                    <div className="sold-out-overlay">Out of Stock</div>
                  )}
                </div>
                <div className="product-card-body">
                  {p.category?.name && (
                    <div className="product-category-tag">
                      {p.category.name}
                    </div>
                  )}
                  <div className="product-name">{p.name}</div>
                  {p.description && (
                    <div className="product-desc">
                      {p.description.length > 65
                        ? `${p.description.substring(0, 65)}…`
                        : p.description}
                    </div>
                  )}
                  <div className="product-price">
                    ${Number(p.price).toFixed(2)}
                  </div>
                  <StockBadge stock={stock} />
                  <Link
                    to={`/product/${p.id}`}
                    className="btn-gold w-100"
                    style={{ marginTop: "0.85rem" }}
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && products.length > 0 && filtered.length > 0 && (
        <div
          style={{
            marginTop: "3rem",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: "0.8rem",
          }}
        >
          <p>✨ Quality products curated just for you ✨</p>
        </div>
      )}
    </div>
  );
}

export default Products;
