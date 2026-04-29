import { useEffect, useState } from "react";
import api from "../api/axiosConfig";
import "../components/css/admin.css";

export const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("overview"); // "overview" | "products" | "orders"
    
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingProduct, setEditingProduct] = useState(null); // For inline stock edit
    const [editFormProduct, setEditFormProduct] = useState(null); // For full form edit
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
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
        } catch (error) {
            console.error("Failed to update stock", error);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await api.delete(`/api/products/${id}`);
                setProducts(products.filter(p => p._id !== id));
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
            setShowAddForm(false);
            setEditFormProduct(null);
            setNewProduct({ title: '', price: 0, stock: 0, category: '', description: '', thumbnail: '' });
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

    // Calculate Overview Metrics
    const totalSales = orders.reduce((acc, order) => acc + order.totalPrice, 0);
    const totalOrders = orders.length;
    const totalProducts = products.length;

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
                            onClick={() => setActiveTab("overview")}
                        >
                            Overview
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
                            onClick={() => setActiveTab("products")}
                        >
                            Manage Products
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
                            onClick={() => setActiveTab("orders")}
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
                                    style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', minWidth: '250px' }}
                                />
                            </div>
                            <button onClick={() => {
                                setShowAddForm(!showAddForm);
                                if (showAddForm) {
                                    setEditFormProduct(null);
                                    setNewProduct({ title: '', price: 0, stock: 0, category: '', description: '', thumbnail: '' });
                                }
                            }} style={{ padding: '10px 20px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                {showAddForm ? "Cancel" : "+ Add New Product"}
                            </button>
                        </div>

                        {showAddForm && (
                            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' }}>
                                <h3>{editFormProduct ? "Edit Product" : "Add New Product"}</h3>
                                <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                    <input required type="text" placeholder="Title" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} style={{ padding: '8px' }} />
                                    <input required type="number" placeholder="Price (₹)" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} style={{ padding: '8px' }} />
                                    <input required type="number" placeholder="Initial Stock" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} style={{ padding: '8px' }} />
                                    <input required type="text" placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={{ padding: '8px' }} />
                                    <input required type="text" placeholder="Image URL (Thumbnail)" value={newProduct.thumbnail} onChange={e => setNewProduct({...newProduct, thumbnail: e.target.value})} style={{ padding: '8px', gridColumn: 'span 2' }} />
                                    <textarea required placeholder="Description" rows="3" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{ padding: '8px', gridColumn: 'span 2' }}></textarea>
                                    <button type="submit" style={{ gridColumn: 'span 2', padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
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
                                                    <button onClick={() => startEditProduct(product)} style={{ padding: '5px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                                                    <button onClick={() => handleDeleteProduct(product._id)} className="btn-delete">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                                    disabled={currentPage === 1}
                                    style={{ padding: '8px 15px', border: '1px solid #ccc', borderRadius: '4px', background: currentPage === 1 ? '#f1f5f9' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                                >
                                    Previous
                                </button>
                                <span>Page {currentPage} of {totalPages}</span>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                                    disabled={currentPage === totalPages}
                                    style={{ padding: '8px 15px', border: '1px solid #ccc', borderRadius: '4px', background: currentPage === totalPages ? '#f1f5f9' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "orders" && (
                    <div className="admin-orders">
                        <div className="products-table-wrapper">
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Total</th>
                                        <th>Items Ordered</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order._id}>
                                            <td>{order._id.substring(order._id.length - 8)}</td>
                                            <td>
                                                {order.user ? order.user.name : "Guest"}
                                                <br/>
                                                <small style={{color: '#666'}}>{order.user ? order.user.email : ""}</small>
                                            </td>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td><strong style={{color: '#212121'}}>₹{order.totalPrice.toFixed(2)}</strong></td>
                                            <td>
                                                <ul style={{ listStyleType: "none", paddingLeft: "0", margin: 0, fontSize: "0.9rem" }}>
                                                    {order.orderItems.map((item, idx) => (
                                                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                            <img src={item.thumbnail} alt={item.title} width="30" height="30" style={{ objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                                                            <span>
                                                                {item.title} <span style={{color: '#666'}}>(x{item.quantity})</span>
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
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
