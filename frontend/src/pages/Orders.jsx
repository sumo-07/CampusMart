import { useEffect, useState, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyOrders, cancelOrder, deleteOrder, retryOrderPayment, verifyRazorpayPayment } from "../utils/orderUtils";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { PrintableOrderSlip } from "../components/PrintableOrderSlip";
import '../components/css/orders.css';

export const Orders = () => {
    const [cancellingId, setCancellingId] = useState(null);
    const [payingId, setPayingId] = useState(null);
    const [printingOrder, setPrintingOrder] = useState(null);
    const { user, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        data: orders = [],
        isLoading: loading,
        isFetching: refreshing,
        refetch: refetchOrders,
    } = useQuery({
        queryKey: ["myOrders"],
        queryFn: getMyOrders,
        staleTime: 1000 * 60 * 5, // 5 minutes (Industry standard production sweet-spot for order tracking)
        gcTime: 1000 * 60 * 15,   // 15 minutes memory retention
        enabled: Boolean(user && !authLoading),
    });

    const handleManualRefresh = async () => {
        try {
            await refetchOrders();
        } catch (error) {
            console.error("Failed to refresh orders", error);
        }
    };

    useEffect(() => {
        if (printingOrder) {
            const timer = setTimeout(() => {
                window.print();
            }, 120);

            const handleAfterPrint = () => {
                setPrintingOrder(null);
            };

            window.addEventListener("afterprint", handleAfterPrint);

            return () => {
                clearTimeout(timer);
                window.removeEventListener("afterprint", handleAfterPrint);
            };
        }
    }, [printingOrder]);

    const handlePrintOrder = (order) => {
        setPrintingOrder(order);
    };

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    const handleCancelOrder = async (orderId, isUnpaidPending = false) => {
        const confirmMsg = isUnpaidPending
            ? "Are you sure you want to cancel this pending order? It will be permanently removed from your orders."
            : "Are you sure you want to cancel this order? Items will be restocked to the store.";
        if (!window.confirm(confirmMsg)) {
            return;
        }

        setCancellingId(orderId);
        try {
            if (isUnpaidPending) {
                await deleteOrder(orderId);
            } else {
                await cancelOrder(orderId);
            }
            queryClient.invalidateQueries({ queryKey: ["myOrders"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["product"] });
            queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
        } catch (error) {
            alert(error.response?.data?.message || "Failed to cancel order.");
        } finally {
            setCancellingId(null);
        }
    };

    const handlePayNow = async (order) => {
        setPayingId(order._id);
        try {
            const data = await retryOrderPayment(order._id);
            if (!data.razorpayOrder) {
                throw new Error("Failed to initialize Razorpay payment session.");
            }

            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                alert("Unable to load Razorpay SDK. Please check your internet connection.");
                setPayingId(null);
                return;
            }

            const options = {
                key: data.keyId,
                amount: data.razorpayOrder.amount,
                currency: data.razorpayOrder.currency,
                name: "CampusMart",
                description: `Order #${order._id}`,
                order_id: data.razorpayOrder.id,
                prefill: {
                    name: order.shippingAddress?.fullName || user?.name || "",
                    email: user?.email || "",
                    contact: order.shippingAddress?.phone || "",
                },
                theme: {
                    color: "#4f46e5",
                },
                handler: async function (response) {
                    try {
                        await verifyRazorpayPayment({
                            orderId: order._id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        queryClient.invalidateQueries({ queryKey: ["myOrders"] });
                        queryClient.invalidateQueries({ queryKey: ["products"] });
                        queryClient.invalidateQueries({ queryKey: ["product"] });
                        queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
                        alert("Payment successful! Your order is now confirmed.");
                    } catch (err) {
                        alert(err.response?.data?.message || "Payment verification failed.");
                        queryClient.invalidateQueries({ queryKey: ["myOrders"] });
                    } finally {
                        setPayingId(null);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setPayingId(null);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response) {
                alert(`Payment failed: ${response.error.description || "Transaction declined."}`);
                setPayingId(null);
            });
            rzp.open();
        } catch (error) {
            alert(error.response?.data?.message || error.message || "Failed to initiate payment.");
            setPayingId(null);
        }
    };

    const renderStatusBadge = (status = "Pending") => {
        const lower = status.toLowerCase();
        let icon = "🟡";
        if (lower === "processing") icon = "🔵";
        if (lower === "shipped") icon = "🟣";
        if (lower === "delivered") icon = "🟢";
        if (lower === "cancelled") icon = "🔴";

        return (
            <span className={`status-badge ${lower}`}>
                <span>{icon}</span> {status}
            </span>
        );
    };

    if (loading) return <p className="loading-text">Loading your orders...</p>;

    return (
        <section className="orders-section">
            <div className="orders-header-bar">
                <h1 className="orders-title">My Orders</h1>
                <button
                    type="button"
                    onClick={handleManualRefresh}
                    className="orders-refresh-btn no-print"
                    disabled={refreshing || loading}
                    title="Check latest order status from server"
                >
                    <span className={`refresh-icon ${refreshing ? "spinning" : ""}`}>🔄</span>
                    {refreshing ? "Checking..." : "Refresh Status"}
                </button>
            </div>

            {orders.length === 0 ? (
                <div className="orders-list">
                    <div className="orders-empty">
                        <p>You have no past orders.</p>
                        <button
                            onClick={() => navigate("/product")}
                            className="start-shopping-btn"
                        >
                            Start Shopping
                        </button>
                    </div>
                </div>
            ) : (
                <div className="orders-list">
                    {orders.map((order) => {
                        const status = order.orderStatus || "Pending";
                        const canCancel = status === "Pending" || status === "Processing";
                        const paymentMethod = order.paymentMethod || "COD";
                        let paymentStatus = order.status
                            ? (order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase())
                            : (order.paymentStatus || "Pending");

                        if (status === "Cancelled") {
                            if (order.status === "PAID" || order.paymentStatus === "Paid" || paymentStatus === "Paid") {
                                paymentStatus = "Refunded";
                            } else {
                                paymentStatus = "Cancelled";
                            }
                        }

                        const isUnpaidPending = paymentMethod === "Razorpay" && (paymentStatus === "Pending" || paymentStatus === "Failed") && status !== "Cancelled";

                        return (
                            <div key={order._id} className="order-card">
                                {/* Order Top Summary Bar */}
                                <div className="order-top-bar">
                                    <div className="order-top-info">
                                        <span className="order-placed-text">
                                            Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="order-top-divider">•</span>
                                        <span className="order-top-id">Order #{order._id}</span>
                                    </div>
                                    <div className="order-top-status">
                                        {renderStatusBadge(status)}
                                    </div>
                                </div>

                                {/* Out-of-Stock Alert Banner for Pending Orders */}
                                {order.hasOutOfStockItems && (
                                    <div className="order-out-of-stock-alert">
                                        <span>⚠️</span>
                                        <span>Items in this pending order are currently out of stock. Payment is disabled. You can cancel and remove this order below.</span>
                                    </div>
                                )}

                                {/* Two-Column Grid */}
                                <div className="order-body-grid">
                                    {/* Left: Ordered Items Column */}
                                    <div className="order-items-column">
                                        <h3 className="order-section-subtitle">Items Ordered ({order.orderItems.length})</h3>
                                        <div className="order-items-list">
                                            {order.orderItems.map((item, index) => (
                                                <div key={index} className="order-item-row">
                                                    <div className="item-image-wrapper">
                                                        <img src={item.thumbnail} alt={item.title} />
                                                    </div>
                                                    <div className="item-details">
                                                        <p
                                                             className="item-title"
                                                             onClick={() => navigate(`/product/${item.productId}`)}
                                                        >
                                                            {item.title}
                                                        </p>
                                                        <p className="item-meta">
                                                            Qty: {item.quantity} × ₹{Number(item.price).toFixed(2)}
                                                        </p>
                                                        <p className="item-subtotal">
                                                            Item Total: ₹{(item.quantity * Number(item.price)).toFixed(2)}
                                                        </p>
                                                        {item.isOutOfStock && (
                                                            <span className="item-out-of-stock-badge">
                                                                ⚠️ Out of Stock (Only {item.availableStock ?? 0} left)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right: Order Details Sidebar */}
                                    <div className="order-details-sidebar">
                                        <h3 className="order-section-subtitle">Order Details</h3>
                                        
                                        <div className="order-sidebar-block">
                                            <span className="sidebar-label">Order Total</span>
                                            <span className="sidebar-total-price">₹{Number(order.amount ?? order.totalPrice ?? 0).toFixed(2)}</span>
                                        </div>

                                        <div className="sidebar-divider" />

                                        <div className="order-sidebar-block">
                                            <span className="sidebar-label">Delivery Address</span>
                                            <div className="sidebar-address">
                                                <strong className="address-name">{order.shippingAddress.fullName}</strong>
                                                <p className="address-line">{order.shippingAddress.address}</p>
                                                <p className="address-line">{order.shippingAddress.city} - {order.shippingAddress.pincode}</p>
                                                {order.shippingAddress.phone && (
                                                    <p className="address-phone">📞 {order.shippingAddress.phone}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="sidebar-divider" />

                                        <div className="order-sidebar-block">
                                            <span className="sidebar-label">Payment</span>
                                            <div className="sidebar-payment">
                                                <span className="payment-method-name">
                                                    {paymentMethod === "COD" ? "💵 Cash on Delivery" : (paymentMethod === "Razorpay" ? "💳 Online (Razorpay)" : paymentMethod)}
                                                </span>
                                                <span className={`payment-status-tag ${paymentStatus.toLowerCase()}`}>
                                                    {paymentStatus}
                                                </span>
                                            </div>
                                            {isUnpaidPending && order.expiresAt && (
                                                <span className="order-expiry-notice">
                                                    ⏱️ Unpaid order expires in {Math.max(1, Math.ceil((new Date(order.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))} days
                                                </span>
                                            )}
                                        </div>

                                        <div className="sidebar-actions">
                                            {isUnpaidPending && (
                                                order.hasOutOfStockItems ? (
                                                    <button
                                                        className="btn-pay-now-sidebar btn-out-of-stock"
                                                        disabled={true}
                                                        title="Cannot proceed: items in this order are out of stock."
                                                    >
                                                        ⛔ Out of Stock
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn-pay-now-sidebar"
                                                        onClick={() => handlePayNow(order)}
                                                        disabled={payingId === order._id || cancellingId === order._id}
                                                    >
                                                        {payingId === order._id ? "Opening..." : "💳 Pay Now"}
                                                    </button>
                                                )
                                            )}

                                            {isUnpaidPending ? (
                                                <button
                                                    className="btn-remove-order-sidebar"
                                                    onClick={() => handleCancelOrder(order._id, true)}
                                                    disabled={cancellingId === order._id || payingId === order._id}
                                                >
                                                    {cancellingId === order._id ? "Removing..." : "🗑️ Cancel & Remove Order"}
                                                </button>
                                            ) : (
                                                canCancel && (
                                                    <button
                                                        className="btn-cancel-order-sidebar"
                                                        onClick={() => handleCancelOrder(order._id, false)}
                                                        disabled={cancellingId === order._id || payingId === order._id}
                                                    >
                                                        {cancellingId === order._id ? "Cancelling..." : "Cancel Order"}
                                                    </button>
                                                )
                                            )}

                                            <button
                                                type="button"
                                                className="btn-print-order-slip-sidebar no-print"
                                                onClick={() => handlePrintOrder(order)}
                                                title="Print packing slip or invoice"
                                            >
                                                🖨️ Print Order Slip
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Dedicated Single-Page Tabular Black & White Printable Order Slip */}
            {printingOrder && (
                <PrintableOrderSlip
                    order={{
                        ...printingOrder,
                        user: (printingOrder.user && typeof printingOrder.user === "object" && printingOrder.user.email)
                            ? printingOrder.user
                            : {
                                name: (printingOrder.user && typeof printingOrder.user === "object" && printingOrder.user.name) || user?.name || printingOrder.shippingAddress?.fullName,
                                email: user?.email,
                            },
                    }}
                />
            )}
        </section>
    );
};
