// SellerDashboard.js - Updated with Category Management
import { useState, useEffect, useCallback } from "react";
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventory,
  updateInventory,
} from "../api/api";
import { useToast } from "../App";
import api from "../api/api";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
  imageUrl: "",
};

const EMPTY_CATEGORY_FORM = {
  name: "",
  description: "",
};

function SellerDashboard({ user }) {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeTab, setActiveTab] = useState("products");

  // Category management states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        getProducts(),
        getCategories().catch(() => ({ data: [] })),
      ]);
      const productsData = p.data || [];
      setCategories(c.data || []);

      const withStock = await Promise.all(
        productsData.map(async (product) => {
          try {
            const invRes = await getInventory(product.id);
            const stock = invRes.data?.quantity ?? invRes.data?.stock ?? null;
            return { ...product, stock };
          } catch {
            return { ...product, stock: product.stock ?? null };
          }
        }),
      );

      setProducts(withStock);
    } catch {
      toast("Could not load products.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadCategoriesOnly = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await getCategories();
      setCategories(res.data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast("Could not load categories", "error");
    } finally {
      setLoadingCategories(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Category CRUD operations
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast("Category name is required", "error");
      return;
    }

    setSavingCategory(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, categoryForm);
        toast("Category updated successfully", "success");
      } else {
        await api.post("/categories", categoryForm);
        toast("Category created successfully", "success");
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm(EMPTY_CATEGORY_FORM);
      loadCategoriesOnly();
    } catch (error) {
      console.error("Error saving category:", error);
      toast(
        error.response?.data?.message || "Could not save category",
        "error",
      );
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      toast("Category deleted successfully", "success");
      setDeleteCategoryId(null);
      loadCategoriesOnly();
      loadData(); // Reload products as their categories may have changed
    } catch (error) {
      console.error("Error deleting category:", error);
      toast(
        error.response?.data?.message ||
          "Could not delete category. It may have products associated.",
        "error",
      );
    }
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });
    setShowCategoryForm(true);
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setShowCategoryForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      stock: product.stock ?? "",
      categoryId: product.category?.id || product.categoryId || "",
      imageUrl: product.imageUrl || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      imageUrl: form.imageUrl || null,
      categoryId: form.categoryId ? parseInt(form.categoryId, 10) : undefined,
    };
    try {
      let savedProduct;
      if (editing) {
        const res = await updateProduct(editing.id, payload);
        savedProduct = res.data || editing;
        toast("Product updated!", "success");
      } else {
        const res = await createProduct(payload);
        savedProduct = res.data;
        toast("Product created!", "success");
      }

      if (form.stock !== "" && savedProduct?.id) {
        try {
          await updateInventory(savedProduct.id, parseInt(form.stock, 10));
        } catch (invErr) {
          console.warn("Inventory update failed:", invErr);
        }
      }

      closeForm();
      loadData();
    } catch {
      toast("Could not save product. Check all fields.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      toast("Product deleted.", "success");
      setDeleteId(null);
      loadData();
    } catch {
      toast("Could not delete product.", "error");
    }
  };

  const upd = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="page-wrap">
      {/* Product Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Edit Product" : "Add New Product"}</h3>
              <button className="modal-close" onClick={closeForm}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label">Product Name *</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={upd("name")}
                  placeholder="e.g. Leather Handbag"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.description}
                  onChange={upd("description")}
                  placeholder="Describe your product…"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Product Image URL</label>
                <input
                  className="form-control"
                  value={form.imageUrl}
                  onChange={upd("imageUrl")}
                  placeholder="https://example.com/image.jpg"
                />
                {form.imageUrl && (
                  <div
                    style={{
                      marginTop: "0.6rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid var(--border2)",
                      }}
                    />
                    <span
                      style={{ fontSize: "0.72rem", color: "var(--muted)" }}
                    >
                      Image preview
                    </span>
                  </div>
                )}
              </div>
              <div className="form-row-2">
                <div className="mb-3">
                  <label className="form-label">Price ($) *</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={upd("price")}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={upd("stock")}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.categoryId}
                  onChange={upd("categoryId")}
                >
                  <option value="">— Select category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-gold" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : editing
                      ? "Save Changes"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowCategoryForm(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? "Edit Category" : "Add New Category"}</h3>
              <button
                className="modal-close"
                onClick={() => setShowCategoryForm(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="mb-3">
                <label className="form-label">Category Name *</label>
                <input
                  className="form-control"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  placeholder="e.g., Electronics, Clothing, Books"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this category includes..."
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowCategoryForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                  disabled={savingCategory}
                >
                  {savingCategory
                    ? "Saving..."
                    : editingCategory
                      ? "Save Changes"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirm Modal */}
      {deleteCategoryId && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteCategoryId(null)}
        >
          <div
            className="modal-box confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Delete Category</h3>
              <button
                className="modal-close"
                onClick={() => setDeleteCategoryId(null)}
              >
                ✕
              </button>
            </div>
            <p style={{ color: "var(--muted2)", marginBottom: "1rem" }}>
              Are you sure you want to delete this category?
            </p>
            <p
              style={{
                color: "var(--warning)",
                fontSize: "0.85rem",
                marginBottom: "1.5rem",
              }}
            >
              ⚠️ Note: Products in this category may be affected.
            </p>
            <div className="modal-footer">
              <button
                className="btn-ghost"
                onClick={() => setDeleteCategoryId(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger-ghost"
                style={{
                  background: "var(--danger)",
                  color: "white",
                  padding: "0.6rem 1.4rem",
                }}
                onClick={() => handleDeleteCategory(deleteCategoryId)}
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div
            className="modal-box confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Delete Product</h3>
              <button className="modal-close" onClick={() => setDeleteId(null)}>
                ✕
              </button>
            </div>
            <p style={{ color: "var(--muted2)", marginBottom: "1.5rem" }}>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button
                className="btn-danger-ghost"
                style={{
                  background: "var(--danger)",
                  color: "white",
                  padding: "0.6rem 1.4rem",
                }}
                onClick={() => handleDelete(deleteId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Tabs */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Seller <span>Dashboard</span>
          </h1>
          <p className="page-count" style={{ marginTop: "0.25rem" }}>
            Welcome, {user?.firstName} — manage your products and categories
            below
          </p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              className={`btn-ghost ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
              style={{
                background:
                  activeTab === "products" ? "rgba(201,168,76,.1)" : "",
                color: activeTab === "products" ? "var(--gold)" : "",
              }}
            >
              📦 My Products
            </button>
            <button
              className={`btn-ghost ${activeTab === "categories" ? "active" : ""}`}
              onClick={() => setActiveTab("categories")}
              style={{
                background:
                  activeTab === "categories" ? "rgba(201,168,76,.1)" : "",
                color: activeTab === "categories" ? "var(--gold)" : "",
              }}
            >
              🏷️ Manage Categories
            </button>
          </div>
        </div>
        {activeTab === "products" && (
          <button className="btn-gold" onClick={openCreate}>
            + Add Product
          </button>
        )}
        {activeTab === "categories" && (
          <button className="btn-gold" onClick={openCreateCategory}>
            + Add Category
          </button>
        )}
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <>
          {loading ? (
            <div className="spinner-wrap">
              <div className="spinner" />
              Loading products…
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h2 className="empty-title">No products yet</h2>
              <p className="empty-text">
                Add your first product to start selling.
              </p>
              <button className="btn-gold" onClick={openCreate}>
                + Add Product
              </button>
            </div>
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const stock = p.stock ?? null;
                    const isOut = stock !== null && stock === 0;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="seller-product-name">{p.name}</div>
                          {p.description && (
                            <div className="seller-product-desc">
                              {p.description.substring(0, 50)}
                              {p.description.length > 50 ? "…" : ""}
                            </div>
                          )}
                        </td>
                        <td style={{ color: "var(--muted2)" }}>
                          {p.category?.name || "—"}
                        </td>
                        <td style={{ color: "var(--gold)", fontWeight: 600 }}>
                          ${Number(p.price).toFixed(2)}
                        </td>
                        <td
                          style={{
                            color: isOut
                              ? "var(--danger)"
                              : stock !== null && stock <= 5
                                ? "#e6b17e"
                                : "var(--muted2)",
                          }}
                        >
                          {stock !== null ? stock : "—"}
                        </td>
                        <td>
                          <span
                            className={`status-chip ${isOut ? "chip-out" : "chip-in"}`}
                          >
                            {isOut ? "Out of stock" : "Active"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              className="btn-ghost"
                              style={{
                                padding: "0.35rem 0.75rem",
                                fontSize: "0.72rem",
                              }}
                              onClick={() => openEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-danger-ghost"
                              onClick={() => setDeleteId(p.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <>
          {loadingCategories ? (
            <div className="spinner-wrap" style={{ minHeight: "300px" }}>
              <div className="spinner" />
              Loading categories…
            </div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏷️</div>
              <h2 className="empty-title">No categories yet</h2>
              <p className="empty-text">
                Create categories to organize your products.
              </p>
              <button className="btn-gold" onClick={openCreateCategory}>
                + Add Category
              </button>
            </div>
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td style={{ color: "var(--muted)" }}>#{cat.id}</td>
                      <td style={{ fontWeight: 600, color: "var(--gold)" }}>
                        {cat.name}
                      </td>
                      <td style={{ color: "var(--muted2)" }}>
                        {cat.description || "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            className="btn-ghost"
                            style={{
                              padding: "0.35rem 0.75rem",
                              fontSize: "0.72rem",
                            }}
                            onClick={() => openEditCategory(cat)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-danger-ghost"
                            onClick={() => setDeleteCategoryId(cat.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Category Tips */}
          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "var(--surface2)",
              borderRadius: "var(--rl)",
              border: "1px solid var(--border)",
            }}
          >
            <h4
              style={{
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
                color: "var(--gold)",
              }}
            >
              💡 Category Tips
            </h4>
            <ul
              style={{
                fontSize: "0.8rem",
                color: "var(--muted2)",
                paddingLeft: "1.25rem",
              }}
            >
              <li>Categories help customers find products more easily</li>
              <li>Products can only belong to one category</li>
              <li>You can edit or delete categories anytime</li>
              <li>
                Deleting a category won't delete products, but they'll appear as
                "Uncategorized"
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default SellerDashboard;
