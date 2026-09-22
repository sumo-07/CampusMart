const mongoose = require("mongoose");

// Order Item Sub-schema
const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        thumbnail: { type: String },
        quantity: { type: Number, required: true },
    },
    { _id: false }
);

// Shipping Address Sub-schema
const shippingAddressSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
        phone: { type: String, required: true },
    },
    { _id: false }
);

// Payment Attempt / Transaction History Schema
const paymentSchema = new mongoose.Schema(
    {
        paymentId: { type: String },
        orderId: { type: String },
        signature: { type: String },
        method: { type: String, default: "Razorpay" },
        amount: { type: Number },
        currency: { type: String, default: "INR" },
        status: { type: String },
        error: { type: String },
        capturedAt: { type: Date },
    },
    { timestamps: true }
);

// Refund Sub-schema
const refundSchema = new mongoose.Schema(
    {
        refundId: { type: String },
        paymentId: { type: String },
        amount: { type: Number },
        status: { type: String },
        refundedAt: { type: Date },
    },
    { _id: false }
);

// Main Order Schema
const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        orderItems: [orderItemSchema],
        shippingAddress: shippingAddressSchema,

        // Payment & Order Attributes
        amount: {
            type: Number,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        razorpayOrderId: {
            type: String,
            unique: true,
            sparse: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"],
            default: "PENDING",
        },
        payments: [paymentSchema],
        refund: {
            type: refundSchema,
            default: () => ({}),
        },

        // Lifecycle attributes
        paymentMethod: {
            type: String,
            enum: ["COD", "Razorpay"],
            default: "COD",
        },
        orderStatus: {
            type: String,
            enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
            default: "Pending",
        },
        deliveredAt: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        },
        isStockReserved: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        confirmationEmailSent: {
            type: Boolean,
            default: false,
        },
        adminAlertEmailSent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// TTL index to automatically delete expired pending orders after 10 days
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
