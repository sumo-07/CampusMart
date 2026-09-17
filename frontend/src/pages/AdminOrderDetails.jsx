import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getOrderById, updateOrderStatus } from "../utils/orderUtils";
import { PrintableOrderSlip } from "../components/PrintableOrderSlip";
import api from "../api/axiosConfig";
import "../components/css/admin.css";
import "../components/css/orders.css";

export const AdminOrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getOrderById(orderId);
            setOrder(data);
        } catch (err) {
            console.error("Failed to fetch order details:", err);
            setError(err.response?.data?.message || "Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!order || order.orderStatus === newStatus) return;

        const confirmChange = window.confirm(
            `Are you sure you want to update status from "${order.orderStatus || 'Pending'}" to "${newStatus}"?`
        );
        if (!confirmChange) return;

        try {
            setUpdatingStatus(true);
            setStatusMessage(null);
            const updated = await updateOrderStatus(order._id, newStatus);
            
            setOrder(prev => ({
                ...prev,
                ...updated,
                user: (updated.user && typeof updated.user === "object" && updated.user.name)
                    ? updated.user
                    : (prev.user || updated.user),
            }));

            setStatusMessage({ type: "success", text: `Order status successfully updated to "${newStatus}"` });

            queryClient.invalidateQueries({ queryKey: ["myOrders"] });
            // If cancelled or status changed, sync products cache
            if (newStatus === "Cancelled") {
                queryClient.invalidateQueries({ queryKey: ["products"] });
                queryClient.invalidateQueries({ queryKey: ["product"] });
                queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
            }
        } catch (err) {
            console.error("Failed to update status:", err);
            setStatusMessage({
                type: "error",
                text: err.response?.data?.message || "Failed to update order status",
            });
        } finally {
            setUpdatingStatus(false);
            setTimeout(() => setStatusMessage(null), 5000);
        }
    };

    const copyOrderId = () => {
        if (!order) return;
        navigator.clipboard.writeText(order._id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="section-admin">
                <div className="container">
                    <div className="admin-loading" style={{ textAlign: "center", padding: "4rem 0" }}>
                        <div style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>⏳ Loading order details...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="section-admin">
                <div className="container">
                    <div className="admin-error-card" style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        padding: "2rem",
                        borderRadius: "12px",
                        textAlign: "center",
                        marginTop: "2rem"
                    }}>
                        <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>Order Not Found</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                            {error || "The requested order could not be loaded or does not exist."}
                        </p>
                        <button
                            onClick={() => navigate("/admin?tab=orders")}
                            className="admin-btn-action"
                        >
                            ← Back to Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isAbandonedDraft = order.paymentMethod !== "COD" &&
        order.status !== "PAID" &&
        order.paymentStatus !== "Paid" &&
        order.orderStatus !== "Cancelled" &&
        order.status !== "CANCELLED" &&
        order.status !== "REFUNDED";

    const currentStatus = order.orderStatus || "Pending";
    const paymentStatus = isAbandonedDraft
        ? "Unpaid Draft"
        : ((order.orderStatus === "Cancelled")
            ? ((order.status === "PAID" || order.paymentStatus === "Paid" || order.status === "REFUNDED") ? "Refunded" : "Cancelled")
            : (order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()) : (order.paymentStatus || "Pending")));

    const customerName = (order.user && typeof order.user === "object" && order.user.name)
        ? order.user.name
        : (order.shippingAddress?.fullName || "Guest Customer");

    const customerEmail = (order.user && typeof order.user === "object" && order.user.email)
        ? order.user.email
        : "No registered email";

    const totalAmount = Number(order.amount ?? order.totalPrice ?? 0);
    const itemsSubtotal = order.orderItems?.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0) || totalAmount;

    return (
        <section className="section-admin admin-order-details-section">
            <div className="container">
                {/* Breadcrumbs & Navigation Header */}
                <div className="admin-details-top-bar no-print">
                    <div className="admin-breadcrumb">
                        <Link to="/admin?tab=overview" className="admin-back-btn" title="Back to Dashboard Overview">
                            ← Back to Overview
                        </Link>
                        <span className="breadcrumb-separator">/</span>
                        <Link to="/admin?tab=orders" className="admin-back-link" style={{ color: 'var(--text-secondary)' }}>
                            Orders
                        </Link>
                        <span className="breadcrumb-separator">/</span>
                        <span className="breadcrumb-current">Order #{order._id.substring(order._id.length - 8)}</span>
                    </div>

                    <div className="admin-details-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={fetchOrderDetails}
                            className="orders-refresh-btn"
                            disabled={loading || updatingStatus}
                            title="Refresh order details from server"
                            style={{ padding: '7px 14px', fontSize: '0.85rem' }}
                        >
                            <span className={`refresh-icon ${loading ? "spinning" : ""}`}>🔄</span>
                            {loading ? "Refreshing..." : "Refresh Status"}
                        </button>
                        <button onClick={handlePrint} className="admin-btn-print" title="Print packing slip or invoice">
                            🖨️ Print Order Slip
                        </button>
                    </div>
                </div>

                {isAbandonedDraft && (
                    <div style={{
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.35)',
                        borderRadius: '12px',
                        padding: '14px 20px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#f43f5e',
                        fontSize: '0.95rem'
                    }} className="no-print">
                        <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                        <div>
                            <strong>Abandoned Checkout Draft:</strong> The customer initiated checkout via {order.paymentMethod || "Razorpay"}, but payment was never completed. This order is <strong>not confirmed for fulfillment</strong> and should not be shipped.
                        </div>
                    </div>
                )}

                {/* Main Order Header Banner */}
                <div className="admin-order-header-card">
                    <div className="order-header-info">
                        <div className="order-id-wrapper">
                            <h1 className="admin-order-title">
                                Order <span className="highlight">#{order._id}</span>
                            </h1>
                            <button
                                onClick={copyOrderId}
                                className={`btn-copy-id ${copied ? "copied" : ""}`}
                                title="Copy Full ID"
                            >
                                {copied ? "✓ Copied" : "📋 Copy ID"}
                            </button>
                        </div>
                        <div className="order-meta-dates">
                            <span>Placed on: <strong>{new Date(order.createdAt).toLocaleString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            })}</strong></span>
                            {order.deliveredAt && (
                                <span className="meta-tag delivered">
                                    • Delivered on: {new Date(order.deliveredAt).toLocaleDateString()}
                                </span>
                            )}
                            {order.cancelledAt && (
                                <span className="meta-tag cancelled">
                                    • Cancelled on: {new Date(order.cancelledAt).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Status & Live Updater */}
                    <div className="order-header-status-controls no-print">
                        <div className="current-status-display">
                            <span className="status-label">Lifecycle Status:</span>
                            <span className={`status-badge ${isAbandonedDraft ? "draft" : currentStatus.toLowerCase()}`}>
                                {isAbandonedDraft ? "🛒 Abandoned Draft" : currentStatus}
                            </span>
                        </div>

                        <div className="status-updater-dropdown-wrapper">
                            <label htmlFor="status-select">Change Status:</label>
                            <select
                                id="status-select"
                                className="admin-status-select large"
                                value={currentStatus}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={updatingStatus}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            {updatingStatus && <span className="status-spinner">Updating...</span>}
                        </div>
                    </div>
                </div>

                {/* Status Update Feedback Alert */}
                {statusMessage && (
                    <div className={`admin-status-toast ${statusMessage.type} no-print`}>
                        {statusMessage.type === "success" ? "✓" : "⚠️"} {statusMessage.text}
                    </div>
                )}

                {/* Grid Layout: Customer & Shipping, Payment Info, Order Summary */}
                <div className="admin-details-grid">
                    {/* Left Column: Customer & Delivery Information */}
                    <div className="admin-details-card">
                        <div className="card-header">
                            <div className="card-icon">👤</div>
                            <h2>Customer & Shipping Info</h2>
                        </div>
                        <div className="card-body">
                            <div className="info-group">
                                <span className="info-label">Customer Account</span>
                                <div className="info-value user-name">{customerName}</div>
                                <div className="info-sub">{customerEmail}</div>
                                {order.user && typeof order.user === "object" && order.user._id && (
                                    <small className="info-muted">User ID: {order.user._id}</small>
                                )}
                            </div>

                            <hr className="card-divider" />

                            <div className="info-group">
                                <span className="info-label">Shipping / Delivery Address</span>
                                {order.shippingAddress ? (
                                    <div className="shipping-address-box">
                                        <div className="recipient-name">
                                            <strong>{order.shippingAddress.fullName}</strong>
                                        </div>
                                        <div className="recipient-phone">
                                            📞 <a href={`tel:${order.shippingAddress.phone}`} className="phone-link">
                                                {order.shippingAddress.phone}
                                            </a>
                                        </div>
                                        <div className="recipient-street">
                                            {order.shippingAddress.address}
                                        </div>
                                        <div className="recipient-city">
                                            {order.shippingAddress.city}, PIN: {order.shippingAddress.pincode}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="info-muted">No delivery address recorded.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Payment & Transaction Details */}
                    <div className="admin-details-card">
                        <div className="card-header">
                            <div className="card-icon">💳</div>
                            <h2>Payment & Financials</h2>
                        </div>
                        <div className="card-body">
                            <div className="payment-overview-row">
                                <div className="info-group">
                                    <span className="info-label">Payment Method</span>
                                    <span className="payment-method-badge">
                                        {order.paymentMethod === "COD" ? "💵 Cash on Delivery (COD)" : "⚡ Razorpay Online"}
                                    </span>
                                </div>
                                <div className="info-group">
                                    <span className="info-label">Payment Status</span>
                                    <span className={`payment-status-pill ${paymentStatus.toLowerCase()}`}>
                                        {paymentStatus}
                                    </span>
                                </div>
                            </div>

                            <hr className="card-divider" />

                            {/* Razorpay specific identifiers if applicable */}
                            {order.paymentMethod === "Razorpay" && (
                                <div className="info-group">
                                    <span className="info-label">Razorpay Reference</span>
                                    <div className="ref-item">
                                        <span className="ref-label">Order ID:</span>
                                        <code className="ref-code">{order.razorpayOrderId || "N/A"}</code>
                                    </div>
                                    {order.payments && order.payments.length > 0 && order.payments[order.payments.length - 1].paymentId && (
                                        <div className="ref-item">
                                            <span className="ref-label">Payment ID:</span>
                                            <code className="ref-code">{order.payments[order.payments.length - 1].paymentId}</code>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Transaction history / Payment logs if present */}
                            {order.payments && order.payments.length > 0 ? (
                                <div className="info-group">
                                    <span className="info-label">Transaction History</span>
                                    <div className="transaction-history-list">
                                        {order.payments.map((p, idx) => (
                                            <div key={idx} className="transaction-item">
                                                <div className="tx-header">
                                                    <span className="tx-status">{p.status || "captured"}</span>
                                                    <span className="tx-amount">₹{Number(p.amount || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="tx-sub">
                                                    <span>{p.paymentId || "Direct Entry"}</span>
                                                    {p.capturedAt && (
                                                        <span>• {new Date(p.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="info-group">
                                    <span className="info-label">Transaction Flow</span>
                                    <p className="info-muted">
                                        {order.paymentMethod === "COD"
                                            ? "Payment to be collected in cash upon package delivery."
                                            : "No external payment records registered."}
                                    </p>
                                </div>
                            )}

                            {/* Refund Details if refunded */}
                            {order.refund && order.refund.refundId && (
                                <div className="info-group refund-box">
                                    <span className="info-label" style={{ color: '#06b6d4' }}>Refund Details</span>
                                    <div className="ref-item">
                                        <span className="ref-label">Refund ID:</span>
                                        <code className="ref-code">{order.refund.refundId}</code>
                                    </div>
                                    <div className="ref-item">
                                        <span className="ref-label">Refund Amount:</span>
                                        <strong>₹{Number(order.refund.amount || 0).toFixed(2)}</strong>
                                    </div>
                                    {order.refund.refundedAt && (
                                        <small className="info-muted">
                                            Refunded on {new Date(order.refund.refundedAt).toLocaleString()}
                                        </small>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Full Width Section: Ordered Items Table & Total Breakdown */}
                <div className="admin-details-card items-summary-card">
                    <div className="card-header">
                        <div className="card-icon">📦</div>
                        <h2>Items Ordered ({order.orderItems?.length || 0})</h2>
                    </div>

                    <div className="products-table-wrapper">
                        <table className="products-table admin-order-items-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Product Title</th>
                                    <th>Unit Price</th>
                                    <th>Quantity</th>
                                    <th style={{ textAlign: "right" }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.orderItems && order.orderItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ width: "70px" }}>
                                            <img
                                                src={item.thumbnail}
                                                alt={item.title}
                                                className="order-detail-thumbnail"
                                            />
                                        </td>
                                        <td>
                                            <div className="item-title-link">
                                                <Link to={`/product/${item.productId}`} target="_blank" rel="noreferrer">
                                                    {item.title}
                                                </Link>
                                            </div>
                                            <small className="item-sku">ID: {item.productId}</small>
                                        </td>
                                        <td>₹{Number(item.price).toFixed(2)}</td>
                                        <td>
                                            <span className="item-qty-pill">x{item.quantity}</span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <strong style={{ color: "var(--text-primary)" }}>
                                                ₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                            </strong>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Calculations Summary */}
                    <div className="order-financial-summary">
                        <div className="financial-rows">
                            <div className="financial-row">
                                <span className="label">Items Subtotal</span>
                                <span className="val">₹{itemsSubtotal.toFixed(2)}</span>
                            </div>
                            <div className="financial-row">
                                <span className="label">Shipping & Handling</span>
                                <span className="val free-shipping">FREE (₹0.00)</span>
                            </div>
                            <div className="financial-row grand-total-row">
                                <span className="label">Grand Total</span>
                                <span className="val grand-total">₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dedicated Single-Page Tabular Black & White Printable Order Slip */}
            <PrintableOrderSlip order={order} />
        </section>
    );
};
