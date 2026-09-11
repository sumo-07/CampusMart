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

    // Calculate Overview Metrics
    const totalSales = orders.reduce((acc, order) => acc + (order.amount || order.totalPrice || 0), 0);
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const pendingOrders = orders.filter(o => (o.orderStatus || 'Pending') === 'Pending').length;
    const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered').length;

    // Pagination & Search Logic
    const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p._id.includes(searchQuery));
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    if (loading) return <div className="admin-loading">Loading Dashboard...</div>;

    return (
        <section className="section-admin">
            <div className="container">
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
                        </div>
                        <div className="metric-card">
                            <h3>Total Orders</h3>
                            <p>{totalOrders}</p>
                        </div>
                        <div className="metric-card">
                            <h3>Pending</h3>
                            <p style={{ color: '#eab308' }}>{pendingOrders}</p>
                        </div>
                        <div className="metric-card">
                            <h3>Delivered</h3>
                            <p style={{ color: '#22c55e' }}>{deliveredOrders}</p>
                        </div>
                        <div className="metric-card">
                            <h3>Total Products</h3>
                            <p>{totalProducts}</p>
                        </div>
                    </div>
                )}

                {activeTab === "products" && (
                    <div className="admin-products">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <h2>Manage Inventory</h2>
                                <input
                                    type="text"
                                    placeholder="Search products by title or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="admin-search-input"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    onClick={handleSyncCatalog}
                                    disabled={isSeeding}
                                    className="admin-btn-sync"
                                    title="Fetch and sync products from DummyJSON"
                                >
                                    {isSeeding ? "Syncing..." : "🔄 Sync / Seed Catalog"}
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
                                        <th>Title</th>
                                        <th>Price</th>
                                        <th>Stock</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedProducts.map(product => (
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
                                    ))}
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

                        <div className="products-table-wrapper">
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Total</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Items Ordered</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
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
                                                    color: (order.orderStatus === "Cancelled")
                                                        ? ((order.status === "PAID" || order.paymentStatus === "Paid" || order.status === "REFUNDED") ? "#06b6d4" : "#ef4444")
                                                        : ((order.status === "PAID" || order.paymentStatus === "Paid") ? "#22c55e" : "#eab308")
                                                }}>
                                                    ({order.orderStatus === "Cancelled"
                                                        ? ((order.status === "PAID" || order.paymentStatus === "Paid" || order.status === "REFUNDED") ? "Refunded" : "Cancelled")
                                                        : (order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()) : (order.paymentStatus || "Pending"))})
                                                </small>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${(order.orderStatus || "Pending").toLowerCase()}`}>
                                                    {order.orderStatus || "Pending"}
                                                </span>
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};
