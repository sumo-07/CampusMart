const Order = require("../models/Order");
const User = require("../models/User");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    const { orderItems, shippingAddress, totalPrice } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: "No order items" });
        return;
    }

    try {
        // Create the order
        const order = new Order({
            user: req.user._id,
            orderItems,
            shippingAddress,
            totalPrice,
        });

        const createdOrder = await order.save();

        // Clear the user's cart after successfully placing an order (UNLESS it was a 'Buy Now' bypass)
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
        res.status(500).json({ message: "Server Error while creating order" });
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

module.exports = {
    addOrderItems,
    getMyOrders,
};
