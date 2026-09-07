const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        orderItems: [
            {
                productId: { type: String, required: true },
                title: { type: String, required: true },
                price: { type: Number, required: true },
                thumbnail: { type: String },
                quantity: { type: Number, required: true },
            },
        ],
        shippingAddress: {
            fullName: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            pincode: { type: String, required: true },
            phone: { type: String, required: true },
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        paymentMethod: {
            type: String,
            required: true,
            default: "COD",
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending",
        },
        paidAt: {
            type: Date,
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
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
