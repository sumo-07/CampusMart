import React from "react";
import { createPortal } from "react-dom";
import "./css/printSlip.css";

export const PrintableOrderSlip = ({ order }) => {
    if (!order) return null;

    const customerName = (order.user && typeof order.user === "object" && order.user.name)
        ? order.user.name
        : (order.shippingAddress?.fullName || "Valued Customer");

    const customerEmail = (order.user && typeof order.user === "object" && order.user.email)
        ? order.user.email
        : "N/A";

    const totalAmount = Number(order.amount ?? order.totalPrice ?? 0);
    const itemsSubtotal = order.orderItems?.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0) || totalAmount;

    const paymentStatus = (order.orderStatus === "Cancelled")
        ? ((order.status === "PAID" || order.paymentStatus === "Paid" || order.status === "REFUNDED") ? "Refunded" : "Cancelled")
        : (order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()) : (order.paymentStatus || "Pending"));

    return createPortal(
        <div id="printable-order-slip" className="printable-slip-wrapper">
            {/* Header: Company branding and order metadata */}
            <div className="slip-header">
                <div className="slip-brand">
                    <h1 className="slip-store-name">CAMPUSMART</h1>
                    <p className="slip-doc-type">OFFICIAL ORDER SLIP & INVOICE</p>
                </div>
                <div className="slip-meta-table">
                    <table>
                        <tbody>
                            <tr>
                                <th>Order ID:</th>
                                <td>#{order._id}</td>
                            </tr>
                            <tr>
                                <th>Date:</th>
                                <td>{new Date(order.createdAt).toLocaleString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}</td>
                            </tr>
                            <tr>
                                <th>Order Status:</th>
                                <td><strong>{(order.orderStatus || "Pending").toUpperCase()}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3-Column Tabular Details: Customer, Delivery, Payment */}
            <div className="slip-info-section">
                <table className="slip-info-table">
                    <thead>
                        <tr>
                            <th style={{ width: "35%" }}>CUSTOMER DETAILS</th>
                            <th style={{ width: "40%" }}>DELIVERY ADDRESS</th>
                            <th style={{ width: "25%" }}>PAYMENT DETAILS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div className="info-cell">
                                    <strong>{customerName}</strong>
                                    <div>{customerEmail}</div>
                                    {order.shippingAddress?.phone && <div>Tel: {order.shippingAddress.phone}</div>}
                                </div>
                            </td>
                            <td>
                                <div className="info-cell">
                                    <strong>{order.shippingAddress?.fullName}</strong>
                                    <div>{order.shippingAddress?.address}</div>
                                    <div>{order.shippingAddress?.city} - {order.shippingAddress?.pincode}</div>
                                </div>
                            </td>
                            <td>
                                <div className="info-cell">
                                    <div>Method: <strong>{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online (Razorpay)"}</strong></div>
                                    <div>Status: <strong>{paymentStatus.toUpperCase()}</strong></div>
                                    {order.razorpayOrderId && (
                                        <div className="slip-muted-ref">Ref: {order.razorpayOrderId}</div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Tabular Items Section */}
            <div className="slip-items-section">
                <table className="slip-items-table">
                    <thead>
                        <tr>
                            <th style={{ width: "5%", textAlign: "center" }}>#</th>
                            <th style={{ width: "55%" }}>Item Description</th>
                            <th style={{ width: "12%", textAlign: "center" }}>Qty</th>
                            <th style={{ width: "14%", textAlign: "right" }}>Price (₹)</th>
                            <th style={{ width: "14%", textAlign: "right" }}>Total (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.orderItems && order.orderItems.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ textAlign: "center" }}>{idx + 1}</td>
                                <td>
                                    <strong>{item.title}</strong>
                                    {item.productId && (
                                        <span className="slip-item-id"> (ID: {item.productId.substring(item.productId.length - 8)})</span>
                                    )}
                                </td>
                                <td style={{ textAlign: "center" }}>{item.quantity}</td>
                                <td style={{ textAlign: "right" }}>{Number(item.price).toFixed(2)}</td>
                                <td style={{ textAlign: "right" }}>{(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Tabular Totals Calculation Section */}
            <div className="slip-totals-section">
                <table className="slip-totals-table">
                    <tbody>
                        <tr>
                            <td>Items Subtotal:</td>
                            <td style={{ textAlign: "right" }}>₹{itemsSubtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Delivery Fee:</td>
                            <td style={{ textAlign: "right" }}>FREE (₹0.00)</td>
                        </tr>
                        <tr className="slip-grand-total-row">
                            <td><strong>TOTAL AMOUNT:</strong></td>
                            <td style={{ textAlign: "right" }}><strong>₹{totalAmount.toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Document Footer */}
            <div className="slip-footer">
                <p>Thank you for your order with CampusMart! This is a computer-generated order slip.</p>
            </div>
        </div>,
        document.body
    );
};
