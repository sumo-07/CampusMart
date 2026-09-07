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

module.exports = {
    addOrderItems,
    getMyOrders,
    getAllOrders,
};
