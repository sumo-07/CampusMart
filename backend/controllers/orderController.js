const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    const { orderItems, shippingAddress } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ message: "No order items provided" });
    }

    if (!shippingAddress) {
        return res.status(400).json({ message: "Shipping address is required" });
    }

    try {
        const verifiedOrderItems = [];
        const productsToUpdate = [];
        let calculatedTotalPrice = 0;

        // 1. Verify all products, validate stock, and calculate authentic prices
        for (const item of orderItems) {
            const qty = Number(item.quantity);
            if (!qty || qty <= 0) {
                return res.status(400).json({ message: `Invalid quantity for item: ${item.title || item.productId}` });
            }

            if (!mongoose.isValidObjectId(item.productId)) {
                return res.status(400).json({ message: `Invalid product ID format: ${item.productId}` });
            }

            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.title || item.productId}` });
            }

            // Check stock availability
            if (product.stock < qty) {
                return res.status(400).json({
                    message: product.stock === 0
                        ? `"${product.title}" is out of stock`
                        : `Insufficient stock for "${product.title}". Only ${product.stock} available.`,
                });
            }

            verifiedOrderItems.push({
                productId: product._id.toString(),
                title: product.title,
                price: product.price,
                thumbnail: product.thumbnail,
                quantity: qty,
            });

            calculatedTotalPrice += product.price * qty;
            productsToUpdate.push({ product, quantity: qty });
        }

        // 2. Decrement stock for all verified products
        for (const { product, quantity } of productsToUpdate) {
            product.stock -= quantity;
            await product.save();
        }

        // 3. Create and save the order with server-verified prices
        const order = new Order({
            user: req.user._id,
            orderItems: verifiedOrderItems,
            shippingAddress,
            totalPrice: Number(calculatedTotalPrice.toFixed(2)),
            paymentMethod: req.body.paymentMethod || "COD",
            paymentStatus: "Pending",
            orderStatus: "Pending",
        });

        const createdOrder = await order.save();

        // 4. Clear the user's cart after successfully placing an order (UNLESS it was a 'Buy Now' bypass)
        if (!req.body.isBuyNow) {
            const user = await User.findById(req.user._id);
            if (user) {
                user.cart = [];
                await user.save();
            }
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ message: "Server Error while creating order", error: error.message });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Fetch Orders Error:", error);
        res.status(500).json({ message: "Server Error while fetching orders" });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate("user", "id name email").sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Fetch All Orders Error:", error);
        res.status(500).json({ message: "Server Error while fetching all orders" });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const previousStatus = order.orderStatus;

        // If transitioning to Cancelled and wasn't already cancelled, restock inventory
        if (status === "Cancelled" && previousStatus !== "Cancelled") {
            for (const item of order.orderItems) {
                if (mongoose.isValidObjectId(item.productId)) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.stock += item.quantity;
                        await product.save();
                    }
                }
            }
            order.cancelledAt = new Date();
        }

        // If marked as Delivered
        if (status === "Delivered") {
            order.deliveredAt = new Date();
            // If COD, delivery implies collection of cash
            if (order.paymentMethod === "COD" && order.paymentStatus !== "Paid") {
                order.paymentStatus = "Paid";
                order.paidAt = new Date();
            }
        }

        order.orderStatus = status;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        console.error("Update Order Status Error:", error);
        res.status(500).json({ message: "Server error while updating order status", error: error.message });
    }
};

// @desc    Cancel order (Customer or Admin)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelMyOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Verify ownership (or admin)
        if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: "Not authorized to cancel this order" });
        }

        if (order.orderStatus === "Cancelled") {
            return res.status(400).json({ message: "Order is already cancelled" });
        }

        if (order.orderStatus === "Delivered" || order.orderStatus === "Shipped") {
            return res.status(400).json({
                message: `Cannot cancel an order that is already ${order.orderStatus.toLowerCase()}`
            });
        }

        // Restock products into catalog
        for (const item of order.orderItems) {
            if (mongoose.isValidObjectId(item.productId)) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }
        }

        order.orderStatus = "Cancelled";
        order.cancelledAt = new Date();
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        console.error("Cancel Order Error:", error);
        res.status(500).json({ message: "Server error while cancelling order", error: error.message });
    }
};

module.exports = {
    addOrderItems,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    cancelMyOrder,
};
