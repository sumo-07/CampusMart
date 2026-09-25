import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosConfig";
import { updateOrderStatus } from "../utils/orderUtils";
import { NeoSelect } from "../components/UI/NeoSelect";
import { NeoStatusConfirmModal } from "../components/UI/NeoStatusConfirmModal";
import { NeoToast } from "../components/UI/NeoToast";
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
    const [pendingStatusChange, setPendingStatusChange] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [toast, setToast] = useState(null);

    const handleRefreshOrders = useCallback(async (silent = false) => {
        const isSilent = silent === true;
        try {
            if (!isSilent) setRefreshingOrders(true);
            const [res] = await Promise.all([
                api.get("/api/orders"),
                !isSilent ? new Promise((resolve) => setTimeout(resolve, 650)) : Promise.resolve(),
            ]);
            setOrders(res.data);
            lastOrdersFetchRef.current = Date.now();
            queryClient.invalidateQueries({ queryKey: ["myOrders"] });
        } catch (error) {
            console.error("Failed to refresh orders:", error);
            if (!isSilent) {
                alert(error.response?.data?.message || "Failed to fetch orders");
            }
        } finally {
            if (!isSilent) setRefreshingOrders(false);
        }
    }, [queryClient]);

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
    }, [handleRefreshOrders]);

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

    const [imageInputMode, setImageInputMode] = useState("file"); // "file" | "url"
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file (PNG, JPG, WebP, GIF).");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Image size must be less than 5MB.");
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const clearSelectedFile = () => {
        setImageFile(null);
        setImagePreview(editFormProduct ? newProduct.thumbnail : null);
        const fileInput = document.getElementById("product-image-file");
        if (fileInput) fileInput.value = "";
    };

    const closeFormWithAnimation = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setShowAddForm(false);
            setIsAnimatingOut(false);
            setEditFormProduct(null);
            setNewProduct({
                title: '',
                price: 0,
                stock: 0,
                category: '',
                description: '',
                thumbnail: '',
                thumbnailPublicId: null,
                uploadedThumbnail: null,
                uploadedThumbnailPublicId: null,
            });
            setImageFile(null);
            setImagePreview(null);
            setIsUploadingImage(false);
            setImageInputMode("file");
            setIsCustomCategory(false);
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
    const [newProduct, setNewProduct] = useState({
        title: '',
        price: 0,
        stock: 0,
        category: '',
        description: '',
        thumbnail: '',
        thumbnailPublicId: null,
        uploadedThumbnail: null,
        uploadedThumbnailPublicId: null,
    });
    const [categoriesList, setCategoriesList] = useState([]);
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [ordersRes, productsRes, categoriesRes] = await Promise.all([
                api.get("/api/orders"),
                api.get("/api/products"),
                api.get("/api/products/categories").catch(() => ({ data: [] })),
            ]);
            setOrders(ordersRes.data);
            setProducts(productsRes.data.products);
            const fetchedCats = Array.isArray(categoriesRes.data)
                ? categoriesRes.data.map(c => typeof c === 'string' ? c : c.slug || c.name)
                : [];
            setCategoriesList(fetchedCats);
            lastOrdersFetchRef.current = Date.now();
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const allAvailableCategories = Array.from(
        new Set([
            ...categoriesList,
            ...products.map(p => p.category)
        ])
    ).filter(Boolean).sort((a, b) => a.localeCompare(b));

    const handleStockUpdate = async (id, newStock) => {
        const val = parseInt(newStock, 10);
        const parsedStock = isNaN(val) ? 0 : Math.max(0, val);
        try {
            await api.put(`/api/products/${id}`, { stock: parsedStock });
            setProducts(products.map(p => p._id === id ? { ...p, stock: parsedStock } : p));
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

        let finalThumbnail = newProduct.thumbnail;
        let finalThumbnailPublicId = newProduct.thumbnailPublicId;
        let finalUploadedThumbnail = newProduct.uploadedThumbnail;
        let finalUploadedThumbnailPublicId = newProduct.uploadedThumbnailPublicId;

        // If an image file was selected, upload to Cloudinary first
        if (imageFile) {
            try {
                setIsUploadingImage(true);
                const formData = new FormData();
                formData.append("image", imageFile);

                const uploadRes = await api.post("/api/products/upload-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                finalThumbnail = uploadRes.data.url;
                finalThumbnailPublicId = uploadRes.data.publicId;
                finalUploadedThumbnail = uploadRes.data.url;
                finalUploadedThumbnailPublicId = uploadRes.data.publicId;
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
                alert(uploadError.response?.data?.message || "Failed to upload image to Cloudinary. Please verify backend/.env credentials.");
                setIsUploadingImage(false);
                return;
            } finally {
                setIsUploadingImage(false);
            }
        }

        if (Number(newProduct.price) < 0) {
            alert("Price cannot be negative.");
            return;
        }

        if (Number(newProduct.stock) < 0) {
            alert("Stock cannot be negative.");
            return;
        }

        if (!finalThumbnail || !finalThumbnail.trim()) {
            alert("Please provide a product image either by uploading a file or entering an image URL.");
            return;
        }

        if (!newProduct.category || !newProduct.category.trim()) {
            alert("Please select or enter a product category.");
            return;
        }

        const productPayload = {
            ...newProduct,
            price: Math.max(0, Number(newProduct.price) || 0),
            stock: Math.max(0, parseInt(newProduct.stock, 10) || 0),
            category: newProduct.category.trim(),
            thumbnail: finalThumbnail.trim(),
            thumbnailPublicId: finalThumbnailPublicId,
            uploadedThumbnail: finalUploadedThumbnail,
            uploadedThumbnailPublicId: finalUploadedThumbnailPublicId,
            images: [finalThumbnail.trim()],
        };

        try {
            if (editFormProduct) {
                // Update existing product
                const { data } = await api.put(`/api/products/${editFormProduct}`, productPayload);
                setProducts(products.map(p => p._id === editFormProduct ? data : p));
            } else {
                // Create new product
                const { data } = await api.post("/api/products", productPayload);
                setProducts([data, ...products]);
            }
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["product"] });
            queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
            closeFormWithAnimation();
        } catch (error) {
            console.error("Failed to save product", error);
            alert(error.response?.data?.message || "Failed to save product");
        }
    };

    const startEditProduct = (product) => {
        setEditFormProduct(product._id);
        const existingCloudinaryImage =
            product.uploadedThumbnail ||
            (product.thumbnail?.includes("cloudinary.com") ? product.thumbnail : null);
        const existingCloudinaryPublicId =
            product.uploadedThumbnailPublicId ||
            product.thumbnailPublicId ||
            null;

        setNewProduct({
            title: product.title,
            price: product.price,
            stock: product.stock,
            category: product.category,
            description: product.description,
            thumbnail: product.thumbnail,
            thumbnailPublicId: product.thumbnailPublicId || null,
            uploadedThumbnail: existingCloudinaryImage,
            uploadedThumbnailPublicId: existingCloudinaryPublicId,
        });
        setImageFile(null);
        setImagePreview(product.thumbnail);
        setImageInputMode(product.thumbnail?.includes("cloudinary.com") ? "file" : "url");
        setIsCustomCategory(false);
        setShowAddForm(true);
        window.scrollTo(0, 0); // Scroll to form
    };

    const handleInitiateStatusChange = (orderId, newStatus, currentStatus) => {
        if (!orderId || newStatus === currentStatus) return;
        setPendingStatusChange({ orderId, newStatus, currentStatus });
    };

    const handleConfirmOrderStatusChange = async () => {
        if (!pendingStatusChange) return;
        const { orderId, newStatus } = pendingStatusChange;

        try {
            setUpdatingStatus(true);
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
            setPendingStatusChange(null);
            setToast({
                type: "success",
                title: "Status Updated!",
                message: `Order #${orderId.slice(-6)} successfully updated to "${newStatus}".`,
            });
        } catch (error) {
            console.error("Failed to update order status:", error);
            setPendingStatusChange(null);
            setToast({
                type: "error",
                title: "Update Failed",
                message: error.response?.data?.message || "Failed to update order status",
            });
        } finally {
            setUpdatingStatus(false);
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
                                    <span className="admin-control-label">Sort:</span>
                                    <NeoSelect
                                        id="product-sort-select"
                                        value={productSort}
                                        onChange={setProductSort}
                                        options={[
                                            { value: "default", label: "Default / Catalog" },
                                            { value: "stock-asc", label: "⚠️ Stock: Low to High" },
                                            { value: "stock-desc", label: "Stock: High to Low" },
                                            { value: "price-asc", label: "Price: Low to High" },
                                            { value: "price-desc", label: "Price: High to Low" },
                                            { value: "title-asc", label: "Title: A to Z" },
                                            { value: "title-desc", label: "Title: Z to A" }
                                        ]}
                                    />
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
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="Price (₹)"
                                        value={newProduct.price || ''}
                                        onKeyDown={(e) => {
                                            if (e.key === '-' || e.key === 'e') e.preventDefault();
                                        }}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setNewProduct({ ...newProduct, price: '' });
                                            } else {
                                                const num = parseFloat(val);
                                                setNewProduct({ ...newProduct, price: isNaN(num) ? '' : Math.max(0, num) });
                                            }
                                        }}
                                        className="admin-form-input"
                                    />
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="Initial Stock"
                                        value={newProduct.stock === 0 ? '0' : (newProduct.stock || '')}
                                        onKeyDown={(e) => {
                                            if (e.key === '-' || e.key === 'e' || e.key === '.') e.preventDefault();
                                        }}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                setNewProduct({ ...newProduct, stock: '' });
                                            } else {
                                                const num = parseInt(val, 10);
                                                setNewProduct({ ...newProduct, stock: isNaN(num) ? '' : Math.max(0, num) });
                                            }
                                        }}
                                        className="admin-form-input"
                                    />
                                    {!isCustomCategory ? (
                                        <div className="admin-category-control">
                                            <NeoSelect
                                                value={allAvailableCategories.includes(newProduct.category) ? newProduct.category : (newProduct.category ? "__custom__" : "")}
                                                onChange={(val) => {
                                                    if (val === "__custom__") {
                                                        setIsCustomCategory(true);
                                                        setNewProduct({ ...newProduct, category: "" });
                                                    } else {
                                                        setNewProduct({ ...newProduct, category: val });
                                                    }
                                                }}
                                                placeholder="-- Select Category --"
                                                options={[
                                                    ...allAvailableCategories.map((cat) => ({
                                                        value: cat,
                                                        label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, " ")
                                                    })),
                                                    { value: "__custom__", label: "➕ + Add New Category" }
                                                ]}
                                                fullWidth={true}
                                            />
                                        </div>
                                    ) : (
                                        <div className="admin-category-custom-box">
                                            <input
                                                required
                                                type="text"
                                                placeholder="Type new category (e.g. electronics)..."
                                                value={newProduct.category}
                                                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                                className="admin-form-input admin-category-custom-input"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="admin-btn-back-category"
                                                onClick={() => {
                                                    setIsCustomCategory(false);
                                                    setNewProduct({ ...newProduct, category: allAvailableCategories[0] || "" });
                                                }}
                                                title="Return to category dropdown"
                                            >
                                                ✕ Back to list
                                            </button>
                                        </div>
                                    )}

                                    {/* Product Image Section */}
                                    <div className="admin-form-image-section full-width">
                                        <div className="admin-image-mode-row">
                                            <label className="admin-form-label">Product Thumbnail Image</label>
                                            <div className="admin-image-mode-tabs">
                                                <button
                                                    type="button"
                                                    className={`admin-image-tab ${imageInputMode === "file" ? "active" : ""}`}
                                                    onClick={() => setImageInputMode("file")}
                                                >
                                                    ☁️ Upload File
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`admin-image-tab ${imageInputMode === "url" ? "active" : ""}`}
                                                    onClick={() => setImageInputMode("url")}
                                                >
                                                    🔗 Image URL
                                                </button>
                                            </div>
                                        </div>

                                        <div className="admin-image-section-body">
                                            {/* Left Column: Image Selector / Dropzone / URL Input */}
                                            <div className="admin-image-input-col">
                                                {imageInputMode === "file" ? (
                                                    <div className="admin-file-upload-box">
                                                        <input
                                                            type="file"
                                                            id="product-image-file"
                                                            accept="image/png, image/jpeg, image/webp, image/gif"
                                                            onChange={handleFileChange}
                                                            style={{ display: "none" }}
                                                        />
                                                        <label htmlFor="product-image-file" className={`admin-file-dropzone ${imageFile ? 'has-file' : ''}`}>
                                                            <span className="upload-icon">{imageFile ? '✅' : '📤'}</span>
                                                            <span className="upload-text">
                                                                {imageFile ? imageFile.name : (editFormProduct ? "Choose new image to replace current thumbnail" : "Click to select or drop image here")}
                                                            </span>
                                                            <span className="upload-hint">PNG, JPG, WebP, or GIF (Max 5MB)</span>
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="admin-url-upload-box">
                                                        <input
                                                            type="url"
                                                            placeholder="Paste image URL (e.g. https://...)"
                                                            value={newProduct.thumbnail}
                                                            onChange={e => {
                                                                setNewProduct({ ...newProduct, thumbnail: e.target.value });
                                                                setImagePreview(e.target.value);
                                                            }}
                                                            className="admin-form-input"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column: Switch Back to Uploaded Image Banner OR Side Preview */}
                                            <div className="admin-image-side-col">
                                                {newProduct.uploadedThumbnail && newProduct.thumbnail !== newProduct.uploadedThumbnail ? (
                                                    <div className="admin-saved-upload-banner">
                                                        <div className="admin-saved-upload-left">
                                                            <img
                                                                src={newProduct.uploadedThumbnail}
                                                                alt="Preserved uploaded"
                                                                className="admin-saved-upload-preview-thumb saved-upload-preview-thumb"
                                                            />
                                                            <div className="admin-saved-upload-details">
                                                                <div className="admin-saved-upload-badge">
                                                                    <span>☁️ Preserved Upload</span>
                                                                </div>
                                                                <p className="admin-saved-upload-note">
                                                                    Your uploaded image is safely saved in Cloudinary.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="admin-btn-restore-upload"
                                                            onClick={() => {
                                                                setNewProduct({
                                                                    ...newProduct,
                                                                    thumbnail: newProduct.uploadedThumbnail,
                                                                    thumbnailPublicId: newProduct.uploadedThumbnailPublicId,
                                                                });
                                                                setImagePreview(newProduct.uploadedThumbnail);
                                                                setImageFile(null);
                                                                setImageInputMode("file");
                                                            }}
                                                            title="Switch product thumbnail back to the preserved uploaded image"
                                                        >
                                                            ↩️ Switch Back to Uploaded Image
                                                        </button>
                                                    </div>
                                                ) : (
                                                    imagePreview ? (
                                                        <div className="admin-image-preview-card side-preview">
                                                            <img
                                                                src={imagePreview}
                                                                alt="Thumbnail Preview"
                                                                className="preview-img"
                                                                onError={(e) => { e.target.style.display = "none"; }}
                                                                onLoad={(e) => { e.target.style.display = "block"; }}
                                                            />
                                                            <div className="preview-meta">
                                                                <span className="preview-status">
                                                                    {imageFile ? "New file ready for upload" : "Active product thumbnail"}
                                                                </span>
                                                                {imageFile && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={clearSelectedFile}
                                                                        className="admin-btn-clear-file"
                                                                    >
                                                                        ✕ Remove Selected File
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="admin-image-empty-placeholder">
                                                            <span className="placeholder-icon">🖼️</span>
                                                            <div className="placeholder-text">
                                                                <span className="placeholder-title">Live Preview</span>
                                                                <span className="placeholder-hint">Select a file or enter an image URL to preview</span>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Bottom Preview (shown if Preserved Banner occupies the right column and active preview is also present) */}
                                        {newProduct.uploadedThumbnail && newProduct.thumbnail !== newProduct.uploadedThumbnail && imagePreview && (
                                            <div className="admin-image-preview-card bottom-preview">
                                                <img
                                                    src={imagePreview}
                                                    alt="Thumbnail Preview"
                                                    className="preview-img"
                                                    onError={(e) => { e.target.style.display = "none"; }}
                                                    onLoad={(e) => { e.target.style.display = "block"; }}
                                                />
                                                <div className="preview-meta">
                                                    <span className="preview-status">
                                                        {imageFile ? "New file staged for upload" : "Current active thumbnail (external URL / new edit)"}
                                                    </span>
                                                    {imageFile && (
                                                        <button
                                                            type="button"
                                                            onClick={clearSelectedFile}
                                                            className="admin-btn-clear-file"
                                                        >
                                                            ✕ Remove Selected File
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <textarea required placeholder="Description" rows="3" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="admin-form-textarea full-width"></textarea>
                                    <button type="submit" disabled={isUploadingImage} className="admin-form-submit-btn">
                                        {isUploadingImage
                                            ? "Uploading to Cloudinary..."
                                            : (editFormProduct ? "Save Changes" : "Create Product")}
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
                                                        <div className="stock-edit-box">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                className="stock-inline-input"
                                                                defaultValue={product.stock}
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === '-' || e.key === 'e' || e.key === '.') e.preventDefault();
                                                                    if (e.key === "Enter") {
                                                                        handleStockUpdate(product._id, e.target.value);
                                                                    } else if (e.key === "Escape") {
                                                                        setEditingProduct(null);
                                                                    }
                                                                }}
                                                                onBlur={(e) => handleStockUpdate(product._id, e.target.value)}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="stock-save-btn"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    const inputEl = e.currentTarget.parentElement.querySelector("input");
                                                                    if (inputEl) handleStockUpdate(product._id, inputEl.value);
                                                                }}
                                                                title="Save stock"
                                                            >
                                                                ✓
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="stock-display-pill"
                                                            onClick={() => setEditingProduct(product._id)}
                                                            title="Click to edit stock"
                                                        >
                                                            <span className="stock-qty">{product.stock}</span>
                                                            <span className="stock-edit-hint">(click to edit)</span>
                                                        </div>
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
                        <div className="admin-orders-header">
                            <div className="admin-orders-title-group">
                                <h2 className="admin-orders-title">Customer Orders</h2>
                                <span className="admin-orders-badge">
                                    {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleRefreshOrders(false)}
                                className="orders-refresh-btn"
                                disabled={refreshingOrders || loading}
                                title="Fetch latest incoming orders from database"
                            >
                                <span className={`refresh-icon ${refreshingOrders ? "spinning" : ""}`}>🔄</span>
                                <span>{refreshingOrders ? "Checking..." : "Refresh Orders"}</span>
                            </button>
                        </div>

                        <div className="admin-orders-toolbar">
                            <div className="admin-orders-filters-row">
                                <div className="admin-search-wrapper orders-search">
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
                                    <span className="admin-control-label">Status:</span>
                                    <NeoSelect
                                        id="order-status-select"
                                        value={orderStatusFilter}
                                        onChange={setOrderStatusFilter}
                                        options={[
                                            { value: "all", label: `📦 Confirmed Orders (${confirmedOrders.length})` },
                                            { value: "Pending", label: `⏳ Pending Fulfillment (${pendingOrders})` },
                                            { value: "Processing", label: `⚙️ Processing (${orders.filter(o => !isAbandonedDraft(o) && o.orderStatus === 'Processing').length})` },
                                            { value: "Shipped", label: `🚚 Shipped (${orders.filter(o => !isAbandonedDraft(o) && o.orderStatus === 'Shipped').length})` },
                                            { value: "Delivered", label: `✅ Delivered (${deliveredOrders})` },
                                            { value: "Cancelled", label: `❌ Cancelled (${orders.filter(o => !isAbandonedDraft(o) && o.orderStatus === 'Cancelled').length})` },
                                            { value: "Abandoned", label: `🛒 Abandoned Drafts (${abandonedOrders.length})` },
                                            { value: "all-with-drafts", label: `📋 All Records (inc. Drafts) (${orders.length})` }
                                        ]}
                                    />
                                </div>

                                <div className="admin-filter-group">
                                    <span className="admin-control-label">Sort:</span>
                                    <NeoSelect
                                        id="order-sort-select"
                                        value={orderSort}
                                        onChange={setOrderSort}
                                        options={[
                                            { value: "date-desc", label: "📅 Date: Newest First" },
                                            { value: "date-asc", label: "📅 Date: Oldest First" },
                                            { value: "amount-desc", label: "💰 Total: High to Low" },
                                            { value: "amount-asc", label: "💰 Total: Low to High" }
                                        ]}
                                    />
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

                            <div className="admin-orders-summary-bar">
                                <span className="admin-orders-count-text">
                                    Showing <strong>{sortedOrders.length}</strong> {orderStatusFilter === "Abandoned" ? "abandoned checkout(s)" : "order(s)"}
                                </span>
                                {orderStatusFilter === "all" && abandonedOrders.length > 0 && (
                                    <span className="admin-drafts-notice">
                                        ({abandonedOrders.length} unpaid draft{abandonedOrders.length > 1 ? 's' : ''} segregated in <button type="button" onClick={() => setOrderStatusFilter("Abandoned")} className="admin-drafts-link">Abandoned Drafts</button>)
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
                                                    <div className="admin-order-customer-name">
                                                        {(order.user && typeof order.user === 'object' && order.user.name)
                                                            ? order.user.name
                                                            : (order.shippingAddress?.fullName || (order.user ? "Customer" : "Guest"))}
                                                    </div>
                                                    {((order.user && typeof order.user === 'object' && order.user.email) || order.shippingAddress?.phone) && (
                                                        <small className="admin-order-customer-contact">
                                                            {(order.user && typeof order.user === 'object' && order.user.email) || order.shippingAddress?.phone}
                                                        </small>
                                                    )}
                                                </td>
                                                <td className="admin-order-date">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td><strong className="admin-order-total-amount">₹{Number(order.amount ?? order.totalPrice ?? 0).toFixed(2)}</strong></td>
                                                <td>
                                                    <div className="admin-payment-cell">
                                                        <span className="admin-payment-method">
                                                            {order.paymentMethod === "COD" ? "💵 COD" : (order.paymentMethod || "COD")}
                                                        </span>
                                                        <span className={`admin-payment-pill ${
                                                            isAbandonedDraft(order)
                                                                ? "draft"
                                                                : (order.orderStatus === "Cancelled")
                                                                    ? "cancelled"
                                                                    : ((order.status === "PAID" || order.paymentStatus === "Paid") ? "paid" : "pending")
                                                        }`}>
                                                            {isAbandonedDraft(order)
                                                                ? "Unpaid Draft"
                                                                : (order.orderStatus === "Cancelled")
                                                                    ? ((order.status === "PAID" || order.paymentStatus === "Paid" || order.status === "REFUNDED") ? "Refunded" : "Cancelled")
                                                                    : (order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()) : (order.paymentStatus || "Pending"))}
                                                        </span>
                                                    </div>
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
                                                    <ul className="admin-order-items-list">
                                                        {order.orderItems.map((item, idx) => (
                                                            <li
                                                                key={idx}
                                                                className="admin-order-item-row"
                                                                title={`${item.title} (Qty: ${item.quantity})`}
                                                            >
                                                                <img
                                                                    src={item.thumbnail}
                                                                    alt={item.title}
                                                                    width="32"
                                                                    height="32"
                                                                />
                                                                <span className="admin-order-item-text">
                                                                    {item.title}{' '}
                                                                    <span className="admin-order-item-qty">
                                                                        (x{item.quantity})
                                                                    </span>
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td>
                                                    <div className="admin-order-actions-stack">
                                                        <Link
                                                            to={`/admin/orders/${order._id}`}
                                                            className="admin-btn-view-order"
                                                        >
                                                            👁️ Details
                                                        </Link>
                                                        <NeoSelect
                                                            size="sm"
                                                            fullWidth={true}
                                                            alignRight={true}
                                                            value={order.orderStatus || "Pending"}
                                                            onChange={(val) => handleInitiateStatusChange(order._id, val, order.orderStatus || "Pending")}
                                                            options={[
                                                                { value: "Pending", label: "Pending" },
                                                                { value: "Processing", label: "Processing" },
                                                                { value: "Shipped", label: "Shipped" },
                                                                { value: "Delivered", label: "Delivered" },
                                                                { value: "Cancelled", label: "Cancelled" }
                                                            ]}
                                                        />
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

            {/* Customized Neobrutalist Status Confirmation Modal */}
            <NeoStatusConfirmModal
                isOpen={Boolean(pendingStatusChange)}
                onClose={() => !updatingStatus && setPendingStatusChange(null)}
                onConfirm={handleConfirmOrderStatusChange}
                currentStatus={pendingStatusChange?.currentStatus || "Pending"}
                newStatus={pendingStatusChange?.newStatus}
                orderId={pendingStatusChange?.orderId}
                loading={updatingStatus}
            />

            {/* Bottom-Right Floating Toast Notification */}
            <NeoToast toast={toast} onClose={() => setToast(null)} />
        </section>
    );
};
