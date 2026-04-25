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
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
