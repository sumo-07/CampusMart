import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosConfig";
import { updateOrderStatus } from "../utils/orderUtils";
import "../components/css/admin.css";
import "../components/css/orders.css";

export const AdminDashboard = () => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") || "overview";
    const [activeTab, setActiveTab] = useState(initialTab);
    const lastOrdersFetchRef = useRef(Date.now());

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && ["overview", "products", "orders"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabSelect = (tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshingOrders, setRefreshingOrders] = useState(false);

    const handleRefreshOrders = async (silent = false) => {
        try {
            if (!silent) setRefreshingOrders(true);
            const res = await api.get("/api/orders");
            setOrders(res.data);
            lastOrdersFetchRef.current = Date.now();
            queryClient.invalidateQueries({ queryKey: ["myOrders"] });
        } catch (error) {
            console.error("Failed to refresh orders:", error);
            if (!silent) {
                alert(error.response?.data?.message || "Failed to fetch orders");
            }
        } finally {
            if (!silent) setRefreshingOrders(false);
        }
    };

    // Smart auto-refresh: When admin switches back to this browser tab after > 2 minutes, quietly fetch new orders
    useEffect(() => {
        const handleFocusOrVisible = () => {
            if (document.visibilityState === "visible") {
                const now = Date.now();
                // 2 minutes throttle (120,000 ms)
                if (now - lastOrdersFetchRef.current > 1000 * 60 * 2) {
                    handleRefreshOrders(true);
                }
            }
        };

        window.addEventListener("focus", handleFocusOrVisible);
        document.addEventListener("visibilitychange", handleFocusOrVisible);

        return () => {
            window.removeEventListener("focus", handleFocusOrVisible);
            document.removeEventListener("visibilitychange", handleFocusOrVisible);
        };
    }, []);

    const [editingProduct, setEditingProduct] = useState(null); // For inline stock edit
    const [editFormProduct, setEditFormProduct] = useState(null); // For full form edit
    const [showAddForm, setShowAddForm] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSeeding, setIsSeeding] = useState(false);
    const [productSort, setProductSort] = useState("default");
    const [orderSort, setOrderSort] = useState("date-desc");
    const [orderStatusFilter, setOrderStatusFilter] = useState("all");
    const [orderSearchQuery, setOrderSearchQuery] = useState("");

    const closeFormWithAnimation = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setShowAddForm(false);
            setIsAnimatingOut(false);
            setEditFormProduct(null);
            setNewProduct({ title: '', price: 0, stock: 0, category: '', description: '', thumbnail: '' });
        }, 350);
    };

    const toggleAddForm = () => {
        if (showAddForm) {
            closeFormWithAnimation();
        } else {
            setShowAddForm(true);
        }
    };
    const [currentPage, setCurrentPage] = useState(1);
    const [newProduct, setNewProduct] = useState({ title: '', price: 0, stock: 0, category: '', description: '', thumbnail: '' });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [ordersRes, productsRes] = await Promise.all([
                api.get("/api/orders"),
                api.get("/api/products")
            ]);
            setOrders(ordersRes.data);
            setProducts(productsRes.data.products);
            lastOrdersFetchRef.current = Date.now();
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStockUpdate = async (id, newStock) => {
        try {
            await api.put(`/api/products/${id}`, { stock: Number(newStock) });
            setProducts(products.map(p => p._id === id ? { ...p, stock: Number(newStock) } : p));
            setEditingProduct(null);
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["product"] });
            queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
        } catch (error) {
            console.error("Failed to update stock", error);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await api.delete(`/api/products/${id}`);
                setProducts(products.filter(p => p._id !== id));
                queryClient.invalidateQueries({ queryKey: ["products"] });
                queryClient.invalidateQueries({ queryKey: ["product"] });
                queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
            } catch (error) {
                console.error("Failed to delete product", error);
            }
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        try {
            if (editFormProduct) {
                // Update existing product
                const { data } = await api.put(`/api/products/${editFormProduct}`, newProduct);
                setProducts(products.map(p => p._id === editFormProduct ? data : p));
            } else {
                // Create new product
                const { data } = await api.post("/api/products", newProduct);
                setProducts([data, ...products]);
            }
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["product"] });
            queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
            closeFormWithAnimation();
        } catch (error) {
            console.error("Failed to save product", error);
            alert("Failed to save product");
        }
    };

    const startEditProduct = (product) => {
        setEditFormProduct(product._id);
        setNewProduct({
            title: product.title,
            price: product.price,
            stock: product.stock,
            category: product.category,
            description: product.description,
            thumbnail: product.thumbnail
        });
        setShowAddForm(true);
        window.scrollTo(0, 0); // Scroll to form
    };

    const handleOrderStatusChange = async (orderId, newStatus) => {
        try {
            const updated = await updateOrderStatus(orderId, newStatus);
            setOrders(prevOrders => prevOrders.map(o => {
                if (o._id === orderId) {
                    return {
                        ...o,
                        ...updated,
                        // Preserve populated user object if updated.user is an unpopulated ID string
                        user: (updated.user && typeof updated.user === 'object' && updated.user.name)
                            ? updated.user
                            : (o.user || updated.user)
                    };
                }
                return o;
            }));
            queryClient.invalidateQueries({ queryKey: ["myOrders"] });
            if (newStatus === "Cancelled") {
                queryClient.invalidateQueries({ queryKey: ["products"] });
                queryClient.invalidateQueries({ queryKey: ["product"] });
                queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
                const productsRes = await api.get("/api/products");
                setProducts(productsRes.data.products);
            }
        } catch (error) {
            console.error("Failed to update order status:", error);
            alert(error.response?.data?.message || "Failed to update order status");
        }
    };

    const handleSyncCatalog = async () => {
        const confirmed = window.confirm(
            "Sync product catalog from DummyJSON?\n\nThis will safely fetch and update catalog items without removing existing product IDs or breaking orders."
        );
        if (!confirmed) return;

        setIsSeeding(true);
        try {
            const { data } = await api.post("/api/products/seed");
            alert(`Catalog Synced Successfully!\n\nMatched & Updated: ${data.matchedCount || 0}\nNewly Inserted: ${data.upsertedCount || 0}\nTotal in Catalog: ${data.totalCount || 0}`);
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
            const res = await api.get("/api/products");
            setProducts(res.data.products);
        } catch (error) {
            console.error("Failed to sync catalog:", error);
            alert(error.response?.data?.message || "Failed to sync products catalog from DummyJSON.");
        } finally {
            setIsSeeding(false);
        }
    };

    // Helper to identify abandoned checkout drafts (unpaid online checkouts)
    const isAbandonedDraft = (o) => {
        // Active COD orders are confirmed customer orders
        if (o.paymentMethod === "COD") return false;
        // Verified paid online orders are confirmed
        if (o.status === "PAID" || o.paymentStatus === "Paid") return false;
        // Explicitly cancelled or refunded orders belong in their own category
        if (o.orderStatus === "Cancelled" || o.status === "CANCELLED" || o.status === "REFUNDED") return false;
        // Remaining unverified/unpaid online checkouts are abandoned drafts
        return true;
    };

    // Calculate Overview Metrics (Standard E-Commerce Isolation)
    // 1. Total Revenue: Only includes confirmed revenue (PAID or active COD, excluding Cancelled/Refunded/Drafts)
    const totalSales = orders
        .filter(o => (o.status === "PAID" || o.paymentMethod === "COD") && o.orderStatus !== "Cancelled" && o.status !== "CANCELLED" && o.status !== "REFUNDED")
        .reduce((acc, order) => acc + (order.amount || order.totalPrice || 0), 0);

    const confirmedOrders = orders.filter(o => !isAbandonedDraft(o));
    const abandonedOrders = orders.filter(o => isAbandonedDraft(o));

    // 2. Confirmed Orders count: excludes abandoned checkout attempts
    const totalOrders = confirmedOrders.length;
    const totalProducts = products.length;

    // 3. Fulfillment Queue: Only confirmed orders that actually need shipping
    // Counts: All active COD orders + all verified PAID online orders with Pending status
    const pendingOrders = orders.filter(o => 
        (o.orderStatus || 'Pending') === 'Pending' && 
        !isAbandonedDraft(o) &&
        o.orderStatus !== 'Cancelled' && 
        o.status !== 'CANCELLED' && 
        o.status !== 'REFUNDED' &&
        (o.paymentMethod === 'COD' || o.status === 'PAID' || o.paymentStatus === 'Paid')
    ).length;

    const deliveredOrders = orders.filter(o => !isAbandonedDraft(o) && o.orderStatus === 'Delivered').length;

    // Filter & Sort Products
    const filteredProducts = products.filter(p =>
        (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p._id && p._id.includes(searchQuery))
    );

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (productSort) {
            case "stock-asc":
                return (a.stock ?? 0) - (b.stock ?? 0);
            case "stock-desc":
                return (b.stock ?? 0) - (a.stock ?? 0);
            case "price-asc":
                return (a.price ?? 0) - (b.price ?? 0);
            case "price-desc":
                return (b.price ?? 0) - (a.price ?? 0);
            case "title-asc":
                return (a.title || "").localeCompare(b.title || "");
            case "title-desc":
                return (b.title || "").localeCompare(a.title || "");
            default:
                return 0;
        }
    });

    const itemsPerPage = 10;
    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
    const paginatedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page on search or sort change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, productSort]);

    // Filter & Sort Orders
    const filteredOrders = orders.filter(order => {
        const isDraft = isAbandonedDraft(order);

        if (orderStatusFilter === "all") {
            // Standard active store view: Confirmed orders only (excludes abandoned drafts so operations aren't polluted)
            if (isDraft) return false;
        } else if (orderStatusFilter === "Pending") {
            // Fulfillment queue: Only active COD and verified PAID online orders needing shipping
            if (isDraft) return false;
            const currentStatus = order.orderStatus || "Pending";
            if (currentStatus !== "Pending") return false;
            if (order.orderStatus === "Cancelled" || order.status === "CANCELLED" || order.status === "REFUNDED") return false;
            if (order.paymentMethod !== "COD" && order.status !== "PAID" && order.paymentStatus !== "Paid") return false;
        } else if (orderStatusFilter === "Abandoned") {
            // Dedicated Abandoned Checkouts Section
            if (!isDraft) return false;
        } else if (orderStatusFilter === "all-with-drafts") {
            // Show everything including drafts for raw inspection
        } else {
            // Specific order statuses (Processing, Shipped, Delivered, Cancelled)
            if (isDraft) return false;
            const currentStatus = order.orderStatus || "Pending";
            if (currentStatus !== orderStatusFilter) return false;
        }

        if (orderSearchQuery.trim()) {
            const q = orderSearchQuery.toLowerCase().trim();
            const idMatch = order._id && order._id.toLowerCase().includes(q);
            const customerName = (order.user && typeof order.user === 'object' && order.user.name)
                ? order.user.name.toLowerCase()
                : (order.shippingAddress?.fullName?.toLowerCase() || "");
            const customerEmail = (order.user && typeof order.user === 'object' && order.user.email)
                ? order.user.email.toLowerCase()
                : "";
            const customerPhone = order.shippingAddress?.phone ? String(order.shippingAddress.phone) : "";
            const paymentMethod = order.paymentMethod ? order.paymentMethod.toLowerCase() : "";

            if (!idMatch && !customerName.includes(q) && !customerEmail.includes(q) && !customerPhone.includes(q) && !paymentMethod.includes(q)) {
                return false;
            }
        }
        return true;
    });

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        switch (orderSort) {
            case "date-asc":
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case "date-desc":
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case "amount-asc":
                return Number(a.amount ?? a.totalPrice ?? 0) - Number(b.amount ?? b.totalPrice ?? 0);
            case "amount-desc":
                return Number(b.amount ?? b.totalPrice ?? 0) - Number(a.amount ?? a.totalPrice ?? 0);
            default:
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
    });

    const handleProductSortToggle = (field) => {
        if (field === "title") {
            setProductSort(prev => prev === "title-asc" ? "title-desc" : "title-asc");
        } else if (field === "price") {
            setProductSort(prev => prev === "price-asc" ? "price-desc" : "price-asc");
        } else if (field === "stock") {
            setProductSort(prev => prev === "stock-asc" ? "stock-desc" : "stock-asc");
        }
    };

    const handleOrderSortToggle = (field) => {
        if (field === "date") {
            setOrderSort(prev => prev === "date-desc" ? "date-asc" : "date-desc");
        } else if (field === "amount") {
            setOrderSort(prev => prev === "amount-desc" ? "amount-asc" : "amount-desc");
        }
    };

    const getSortIcon = (currentSort, ascVal, descVal) => {
        if (currentSort === ascVal) return <span className="sort-icon active" aria-label="Sorted ascending">▲</span>;
        if (currentSort === descVal) return <span className="sort-icon active" aria-label="Sorted descending">▼</span>;
        return <span className="sort-icon inactive" aria-label="Sortable">↕</span>;
    };

    if (loading) return <div className="admin-loading">Loading Dashboard...</div>;

    return (
        <section className="section-admin">
            <div className="container">
                {activeTab !== "overview" && (
                    <div className="admin-details-top-bar no-print" style={{ marginBottom: '1.25rem' }}>
                        <div className="admin-breadcrumb">
                            <button
                                type="button"
                                onClick={() => handleTabSelect("overview")}
                                className="admin-back-btn"
                                title="Back to Dashboard Overview"
                            >
                                ← Back to Overview
                            </button>
                            <span className="breadcrumb-separator">/</span>
                            <span className="breadcrumb-current">
                                {activeTab === "products" ? "Manage Products" : "View Orders"}
                            </span>
                        </div>
                    </div>
                )}

                <div className="admin-header">
                    <h1>Admin Dashboard</h1>
                    <div className="admin-tabs">
                        <button
                            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
                            onClick={() => handleTabSelect("overview")}
                        >
                            Overview
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
                            onClick={() => handleTabSelect("products")}
                        >
                            Manage Products
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
                            onClick={() => handleTabSelect("orders")}
                        >
                            View Orders
                        </button>
                    </div>
                </div>

                {activeTab === "overview" && (
                    <div className="admin-overview">
                        <div className="metric-card">
                            <h3>Total Revenue</h3>
                            <p>₹{totalSales.toFixed(2)}</p>
                            <span className="metric-subtext">Verified Paid & COD</span>
                        </div>
                        <div
                            className="metric-card clickable"
                            onClick={() => { setOrderStatusFilter("all"); handleTabSelect("orders"); }}
                            title="View all confirmed orders"
                        >
                            <h3>Confirmed Orders</h3>
                            <p>{totalOrders}</p>
                            <span className="metric-subtext">Active store orders</span>
                        </div>
                        <div
                            className="metric-card clickable"
                            onClick={() => { setOrderStatusFilter("Pending"); handleTabSelect("orders"); }}
                            title="View fulfillment queue"
                        >
                            <h3>Pending Fulfillment</h3>
                            <p className="pending-val">{pendingOrders}</p>
                            <span className="metric-subtext">Needs packing & shipping</span>
                        </div>
                        <div
                            className="metric-card clickable"
                            onClick={() => { setOrderStatusFilter("Delivered"); handleTabSelect("orders"); }}
                            title="View delivered orders"
                        >
                            <h3>Delivered</h3>
                            <p className="delivered-val">{deliveredOrders}</p>
                            <span className="metric-subtext">Completed shipments</span>
                        </div>
                        <div
                            className="metric-card clickable"
                            onClick={() => { setOrderStatusFilter("Abandoned"); handleTabSelect("orders"); }}
                            title="View abandoned checkout drafts"
                        >
                            <h3>Abandoned Drafts</h3>
                            <p className={abandonedOrders.length > 0 ? "abandoned-val" : ""}>{abandonedOrders.length}</p>
                            <span className="metric-subtext">Unpaid online checkouts</span>
                        </div>
                        <div
                            className="metric-card clickable"
                            onClick={() => handleTabSelect("products")}
                            title="Manage product inventory"
                        >
                            <h3>Total Products</h3>
                            <p>{totalProducts}</p>
                            <span className="metric-subtext">In store catalog</span>
                        </div>
                    </div>
                )}

                {activeTab === "products" && (
                    <div className="admin-products">
                        <div className="admin-toolbar-row">
                            <div className="admin-toolbar-group">
                                <h2>Manage Inventory</h2>
                                <div className="admin-search-wrapper">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search products by title, category, ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="admin-search-input"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            className="clear-search-btn"
                                            onClick={() => setSearchQuery("")}
                                            title="Clear search"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <div className="admin-sort-wrapper">
                                    <label htmlFor="product-sort-select" className="admin-control-label">Sort:</label>
                                    <select
                                        id="product-sort-select"
                                        value={productSort}
                                        onChange={(e) => setProductSort(e.target.value)}
                                        className="admin-sort-select"
                                    >
                                        <option value="default">Default / Catalog</option>
                                        <option value="stock-asc">⚠️ Stock: Low to High</option>
                                        <option value="stock-desc">Stock: High to Low</option>
                                        <option value="price-asc">Price: Low to High</option>
                                        <option value="price-desc">Price: High to Low</option>
                                        <option value="title-asc">Title: A to Z</option>
                                        <option value="title-desc">Title: Z to A</option>
                                    </select>
                                </div>
                                {(productSort !== "default" || searchQuery) && (
                                    <button
                                        type="button"
                                        className="admin-btn-reset-filters"
                                        onClick={() => {
                                            setProductSort("default");
                                            setSearchQuery("");
                                        }}
                                        title="Reset filters & sort"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                            <div className="admin-toolbar-actions">
                                <button
                                    type="button"
                                    onClick={handleSyncCatalog}
                                    disabled={isSeeding}
                                    className="admin-btn-sync"
                                    title="Fetch and sync products from DummyJSON"
                                >
                                    {isSeeding ? "Syncing..." : "🔄 Sync Catalog"}
                                </button>
                                <button onClick={toggleAddForm} className={`admin-btn-action ${showAddForm ? "cancel" : ""}`}>
                                    {showAddForm ? "Cancel" : "+ Add New Product"}
                                </button>
                            </div>
                        </div>

                        {(showAddForm || isAnimatingOut) && (
                            <div className={`admin-form-container ${isAnimatingOut ? 'anim-fade-out' : 'anim-fade-in'}`}>
                                <h3>{editFormProduct ? "Edit Product" : "Add New Product"}</h3>
                                <form onSubmit={handleSaveProduct} className="admin-form">
                                    <input required type="text" placeholder="Title" value={newProduct.title} onChange={e => setNewProduct({ ...newProduct, title: e.target.value })} className="admin-form-input" />
                                    <input required type="number" placeholder="Price (₹)" value={newProduct.price || ''} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} className="admin-form-input" />
                                    <input required type="number" placeholder="Initial Stock" value={newProduct.stock || ''} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} className="admin-form-input" />
                                    <input required type="text" placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="admin-form-input" />
                                    <input required type="text" placeholder="Image URL (Thumbnail)" value={newProduct.thumbnail} onChange={e => setNewProduct({ ...newProduct, thumbnail: e.target.value })} className="admin-form-input full-width" />
                                    <textarea required placeholder="Description" rows="3" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="admin-form-textarea"></textarea>
                                    <button type="submit" className="admin-form-submit-btn">
                                        {editFormProduct ? "Save Changes" : "Create Product"}
                                    </button>
                                </form>
                            </div>
                        )}

                        <div className="products-table-wrapper">
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th className="sortable-th" onClick={() => handleProductSortToggle("title")} title="Sort by Title">
                                            <div className="th-content">
                                                <span>Title</span>
                                                {getSortIcon(productSort, "title-asc", "title-desc")}
                                            </div>
                                        </th>
                                        <th className="sortable-th" onClick={() => handleProductSortToggle("price")} title="Sort by Price">
                                            <div className="th-content">
                                                <span>Price</span>
                                                {getSortIcon(productSort, "price-asc", "price-desc")}
                                            </div>
                                        </th>
                                        <th className="sortable-th" onClick={() => handleProductSortToggle("stock")} title="Sort by Stock">
                                            <div className="th-content">
                                                <span>Stock</span>
                                                {getSortIcon(productSort, "stock-asc", "stock-desc")}
                                            </div>
                                        </th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                                                No products found matching your search or filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedProducts.map(product => (
                                            <tr key={product._id}>
                                                <td>
                                                    <img src={product.thumbnail} alt={product.title} width="50" />
                                                </td>
                                                <td>{product.title}</td>
                                                <td>₹{product.price}</td>
                                                <td>
                                                    {editingProduct === product._id ? (
                                                        <input
                                                            type="number"
                                                            defaultValue={product.stock}
                                                            onBlur={(e) => handleStockUpdate(product._id, e.target.value)}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span onClick={() => setEditingProduct(product._id)}>
                                                            {product.stock} <small>(click to edit)</small>
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={() => startEditProduct(product)} className="btn-edit">Edit</button>
                                                        <button onClick={() => handleDeleteProduct(product._id)} className="btn-delete">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        className={`pagination-btn ${currentPage === i + 1 ? "active" : ""}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="pagination-btn"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "orders" && (
                    <div className="admin-orders">
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1.25rem',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Customer Orders</h2>
                                <span style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)'
                                }}>
                                    {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={handleRefreshOrders}
                                className="orders-refresh-btn"
                                disabled={refreshingOrders || loading}
                                title="Fetch latest incoming orders from database"
                            >
                                <span className={`refresh-icon ${refreshingOrders ? "spinning" : ""}`}>🔄</span>
                                {refreshingOrders ? "Checking New Orders..." : "Refresh Orders"}
                            </button>
                        </div>

                        <div className="admin-orders-controls">
                            <div className="admin-orders-search-filter">
                                <div className="admin-search-wrapper">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search orders (ID, customer, email, phone)..."
                                        value={orderSearchQuery}
                                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                                        className="admin-search-input"
                                    />
                                    {orderSearchQuery && (
                                        <button
                                            type="button"
                                            className="clear-search-btn"
                                            onClick={() => setOrderSearchQuery("")}
                                            title="Clear search"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="admin-filter-group">
                                    <label htmlFor="order-status-select" className="admin-control-label">Status:</label>
                                    <select
                                        id="order-status-select"
                                        value={orderStatusFilter}
                                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                                        className="admin-sort-select"
                                    >
                                        <option value="all">📦 Confirmed Orders ({confirmedOrders.length})</option>
                                        <option value="Pending">⏳ Pending Fulfillment ({pendingOrders})</option>
                                        <option value="Processing">⚙️ Processing ({orders.filter(o => !isAbandonedDraft(o) && o.orderStatus === 'Processing').length})</option>
                                        <option value="Shipped">🚚 Shipped ({orders.filter(o => !isAbandonedDraft(o) && o.orderStatus === 'Shipped').length})</option>
                                        <option value="Delivered">✅ Delivered ({deliveredOrders})</option>
                                        <option value="Cancelled">❌ Cancelled ({orders.filter(o => !isAbandonedDraft(o) && o.orderStatus === 'Cancelled').length})</option>
                                        <option value="Abandoned">🛒 Abandoned Drafts ({abandonedOrders.length})</option>
                                        <option value="all-with-drafts">📋 All Records (inc. Drafts) ({orders.length})</option>
                                    </select>
                                </div>

                                <div className="admin-filter-group">
                                    <label htmlFor="order-sort-select" className="admin-control-label">Sort:</label>
                                    <select
                                        id="order-sort-select"
                                        value={orderSort}
                                        onChange={(e) => setOrderSort(e.target.value)}
                                        className="admin-sort-select"
                                    >
                                        <option value="date-desc">📅 Date: Newest First</option>
                                        <option value="date-asc">📅 Date: Oldest First</option>
                                        <option value="amount-desc">💰 Total: High to Low</option>
                                        <option value="amount-asc">💰 Total: Low to High</option>
                                    </select>
                                </div>

                                {(orderStatusFilter !== "all" || orderSearchQuery || orderSort !== "date-desc") && (
                                    <button
                                        type="button"
                                        className="admin-btn-reset-filters"
                                        onClick={() => {
                                            setOrderStatusFilter("all");
                                            setOrderSearchQuery("");
                                            setOrderSort("date-desc");
                                        }}
                                        title="Reset filters & sort"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>

                            <div className="admin-orders-count-indicator">
                                Showing <strong>{sortedOrders.length}</strong> {orderStatusFilter === "Abandoned" ? "abandoned checkout(s)" : "order(s)"}
                                {orderStatusFilter === "all" && abandonedOrders.length > 0 && (
                                    <span style={{ marginLeft: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        ({abandonedOrders.length} unpaid draft{abandonedOrders.length > 1 ? 's' : ''} segregated in <button type="button" onClick={() => setOrderStatusFilter("Abandoned")} style={{ background: 'none', border: 'none', color: '#f43f5e', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 600 }}>Abandoned Drafts</button>)
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="products-table-wrapper">
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th className="sortable-th" onClick={() => handleOrderSortToggle("date")} title="Sort by Date">
                                            <div className="th-content">
                                                <span>Date</span>
                                                {getSortIcon(orderSort, "date-asc", "date-desc")}
                                            </div>
                                        </th>
                                        <th className="sortable-th" onClick={() => handleOrderSortToggle("amount")} title="Sort by Total Amount">
                                            <div className="th-content">
                                                <span>Total</span>
                                                {getSortIcon(orderSort, "amount-asc", "amount-desc")}
                                            </div>
                                        </th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Items Ordered</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                                                No customer orders found matching your search or filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedOrders.map(order => (
                                            <tr key={order._id}>
                                                <td>
                                                    <Link
                                                        to={`/admin/orders/${order._id}`}
                                                        className="admin-order-id-link"
                                                        title="View full order details"
                                                    >
                                                        #{order._id.substring(order._id.length - 8)}
                                                    </Link>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {(order.user && typeof order.user === 'object' && order.user.name)
                                                            ? order.user.name
                                                            : (order.shippingAddress?.fullName || (order.user ? "Customer" : "Guest"))}
                                                    </div>
                                                    {((order.user && typeof order.user === 'object' && order.user.email) || order.shippingAddress?.phone) && (
                                                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                                                            {(order.user && typeof order.user === 'object' && order.user.email) || order.shippingAddress?.phone}
                                                        </small>
                                                    )}
                                                </td>
                                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td><strong style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>₹{Number(order.amount ?? order.totalPrice ?? 0).toFixed(2)}</strong></td>
                                                <td>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                        {order.paymentMethod === "COD" ? "💵 COD" : (order.paymentMethod || "COD")}
                                                    </span>
                                                    <br />
                                                    <small style={{
                                                        fontWeight: 700,
                                                        color: isAbandonedDraft(order)
                                                            ? "#f43f5e"
                                                            : (order.orderStatus === "Cancelled")
                                                                ? ((order.status === "PAID" || order.paymentStatus === "Paid" || order.status === "REFUNDED") ? "#06b6d4" : "#ef4444")
                                                                : ((order.status === "PAID" || order.paymentStatus === "Paid") ? "#22c55e" : "#eab308")
                                                    }}>
                                                        {isAbandonedDraft(order)
                                                            ? "(Unpaid Draft)"
                                                            : (order.orderStatus === "Cancelled")
                                                                ? ((order.status === "PAID" || order.paymentStatus === "Paid" || order.status === "REFUNDED") ? "(Refunded)" : "(Cancelled)")
                                                                : (order.status ? `(${order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()})` : `(${order.paymentStatus || "Pending"})`)}
                                                    </small>
                                                </td>
                                                <td>
                                                    {isAbandonedDraft(order) ? (
                                                        <span className="status-badge draft" title="Unpaid online checkout draft - not confirmed for fulfillment">
                                                            🛒 Abandoned Draft
                                                        </span>
                                                    ) : (
                                                        <span className={`status-badge ${(order.orderStatus || "Pending").toLowerCase()}`}>
                                                            {order.orderStatus || "Pending"}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <ul className="admin-order-items-list" style={{ listStyleType: "none", paddingLeft: "0", margin: 0, fontSize: "0.9rem" }}>
                                                        {order.orderItems.map((item, idx) => (
                                                            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                                <img src={item.thumbnail} alt={item.title} width="30" height="30" style={{ objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-glass)' }} />
                                                                <span>
                                                                    {item.title} <span style={{ color: 'var(--text-secondary)' }}>(x{item.quantity})</span>
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <Link
                                                            to={`/admin/orders/${order._id}`}
                                                            className="admin-btn-view-order"
                                                        >
                                                            👁️ Details
                                                        </Link>
                                                        <select
                                                            className="admin-status-select"
                                                            value={order.orderStatus || "Pending"}
                                                            onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Processing">Processing</option>
                                                            <option value="Shipped">Shipped</option>
                                                            <option value="Delivered">Delivered</option>
                                                            <option value="Cancelled">Cancelled</option>
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};
