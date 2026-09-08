const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const { getRazorpayInstance } = require("../config/razorpay");

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
        const paymentMethod = req.body.paymentMethod || "COD";
        const numericAmount = Number(calculatedTotalPrice.toFixed(2));
        const order = new Order({
            user: req.user._id,
            orderItems: verifiedOrderItems,
            shippingAddress,
            amount: numericAmount,
            totalPrice: numericAmount,
            currency: "INR",
            status: "PENDING",
            paymentMethod: paymentMethod,
            orderStatus: "Pending",
            payments: [],
            refund: {},
        });

        let razorpayOrder = null;
        if (paymentMethod === "Razorpay") {
            const razorpay = getRazorpayInstance();
            razorpayOrder = await razorpay.orders.create({
                amount: Math.round(numericAmount * 100),
                currency: "INR",
                receipt: order._id.toString(),
                notes: {
                    orderId: order._id.toString(),
                    userId: req.user._id.toString(),
                },
            });
            order.razorpayOrderId = razorpayOrder.id;
        }

        const createdOrder = await order.save();

        // 4. Clear the user's cart after successfully placing an order (UNLESS it was a 'Buy Now' bypass)
        if (!req.body.isBuyNow) {
            const user = await User.findById(req.user._id);
            if (user) {
                user.cart = [];
                await user.save();
            }
        }

        if (paymentMethod === "Razorpay") {
            return res.status(201).json({
                ...createdOrder.toObject(),
                razorpayOrder,
                keyId: process.env.RAZORPAY_KEY_ID,
                key: process.env.RAZORPAY_KEY_ID,
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
            });
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
            if (order.paymentMethod === "COD" && order.status !== "PAID") {
                order.status = "PAID";
                order.payments.push({
                    method: "COD",
                    amount: order.amount,
                    currency: order.currency || "INR",
                    status: "captured",
                    capturedAt: new Date(),
                });
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

        const currentStatus = order.orderStatus;
        if (currentStatus === "Cancelled") {
            return res.status(400).json({ message: "Order is already cancelled" });
        }

        if (currentStatus === "Delivered" || currentStatus === "Shipped") {
            return res.status(400).json({
                message: `Cannot cancel an order that is already ${currentStatus.toLowerCase()}`
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

// @desc    Verify Razorpay payment signature
// @route   POST /api/orders/razorpay/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
    const orderId = req.body.orderId || req.body.order_id || req.body.receipt;
    const razorpayOrderId = req.body.razorpayOrderId || req.body.razorpay_order_id;
    const razorpayPaymentId = req.body.razorpayPaymentId || req.body.razorpay_payment_id;
    const razorpaySignature = req.body.razorpaySignature || req.body.razorpay_signature;

    if ((!orderId && !razorpayOrderId) || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ message: "Missing required payment verification parameters" });
    }

    try {
        let order = null;
        if (orderId && mongoose.isValidObjectId(orderId)) {
            order = await Order.findById(orderId);
        }
        if (!order && razorpayOrderId) {
            order = await Order.findOne({ razorpayOrderId });
        }

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: "Not authorized to verify payment for this order" });
        }

        const effectiveOrderId = razorpayOrderId || order.razorpayOrderId;
        if (!effectiveOrderId) {
            return res.status(400).json({ message: "Razorpay order ID missing from order record" });
        }

        // Verify signature using HMAC SHA-256
        const body = `${effectiveOrderId}|${razorpayPaymentId}`;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({ message: "Payment verification failed: Invalid signature" });
        }

        // Update status and append to payments transaction array
        order.status = "PAID";
        order.paymentMethod = "Razorpay";
        order.razorpayOrderId = effectiveOrderId;
        order.payments.push({
            paymentId: razorpayPaymentId,
            orderId: razorpayOrderId,
            signature: razorpaySignature,
            method: "Razorpay",
            amount: order.amount,
            currency: order.currency || "INR",
            status: "captured",
            capturedAt: new Date(),
        });
        if (order.orderStatus === "Pending") {
            order.orderStatus = "Processing";
        }

        const updatedOrder = await order.save();
        res.json({ message: "Payment verified successfully", order: updatedOrder });
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ message: "Server error while verifying payment", error: error.message });
    }
};

// @desc    Retry Razorpay payment for an existing pending order
// @route   POST /api/orders/razorpay/retry/:id
// @access  Private
const retryOrderPayment = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: "Not authorized to pay for this order" });
        }

        if (order.status === "PAID") {
            return res.status(400).json({ message: "Order is already paid" });
        }

        if (order.orderStatus === "Cancelled") {
            return res.status(400).json({ message: "Cannot pay for a cancelled order" });
        }

        const razorpay = getRazorpayInstance();
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.amount * 100),
            currency: order.currency || "INR",
            receipt: order._id.toString(),
            notes: {
                orderId: order._id.toString(),
                userId: req.user._id.toString(),
            },
        });

        order.paymentMethod = "Razorpay";
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.json({
            order,
            razorpayOrder,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error("Retry Payment Error:", error);
        res.status(500).json({ message: "Failed to initiate payment", error: error.message });
    }
};

// @desc    Handle Razorpay Webhook notifications
// @route   POST /api/orders/razorpay/webhook
// @access  Public
const handleRazorpayWebhook = async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // 1. Verify signature if webhookSecret is configured
    if (webhookSecret) {
        if (!signature) {
            console.warn("Razorpay Webhook received without x-razorpay-signature header");
            return res.status(400).json({ message: "Missing signature header" });
        }

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(req.rawBody || JSON.stringify(req.body))
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("Razorpay webhook signature mismatch");
            return res.status(400).json({ message: "Invalid webhook signature" });
        }
    } else {
        console.warn("RAZORPAY_WEBHOOK_SECRET not configured; skipping webhook signature validation.");
    }

    // 2. Process events
    try {
        const event = req.body.event;
        const payload = req.body.payload;

        if (event === "order.paid" || event === "payment.captured") {
            const paymentEntity = payload?.payment?.entity;
            const razorpayOrderId = paymentEntity?.order_id;
            const receipt = payload?.order?.entity?.receipt || paymentEntity?.notes?.orderId;

            let order = null;
            if (razorpayOrderId) {
                order = await Order.findOne({ razorpayOrderId });
            }
            if (!order && receipt && mongoose.isValidObjectId(receipt)) {
                order = await Order.findById(receipt);
            }

            if (order && order.status !== "PAID") {
                order.status = "PAID";
                order.paymentMethod = "Razorpay";
                if (razorpayOrderId) {
                    order.razorpayOrderId = razorpayOrderId;
                }
                order.payments.push({
                    paymentId: paymentEntity?.id,
                    orderId: razorpayOrderId,
                    method: paymentEntity?.method || "Razorpay",
                    amount: (paymentEntity?.amount || 0) / 100,
                    currency: paymentEntity?.currency || "INR",
                    status: "captured",
                    capturedAt: new Date(),
                });
                if (order.orderStatus === "Pending") {
                    order.orderStatus = "Processing";
                }
                await order.save();
                console.log(`[Razorpay Webhook] Order ${order._id} successfully confirmed Paid (${event})`);
            }
        } else if (event === "payment.failed") {
            const paymentEntity = payload?.payment?.entity;
            const razorpayOrderId = paymentEntity?.order_id;
            const receipt = paymentEntity?.notes?.orderId;

            let order = null;
            if (razorpayOrderId) {
                order = await Order.findOne({ razorpayOrderId });
            }
            if (!order && receipt && mongoose.isValidObjectId(receipt)) {
                order = await Order.findById(receipt);
            }

            if (order && order.status !== "PAID") {
                order.status = "FAILED";
                order.payments.push({
                    paymentId: paymentEntity?.id,
                    orderId: razorpayOrderId,
                    method: paymentEntity?.method || "Razorpay",
                    amount: (paymentEntity?.amount || 0) / 100,
                    currency: paymentEntity?.currency || "INR",
                    status: "failed",
                    error: paymentEntity?.error_description || "Payment failed or declined",
                });
                await order.save();
                console.log(`[Razorpay Webhook] Order ${order._id} marked payment Failed: ${paymentEntity?.error_description}`);
            }
        } else if (event === "refund.processed") {
            const refundEntity = payload?.refund?.entity;
            const paymentEntity = payload?.payment?.entity;
            const razorpayOrderId = paymentEntity?.order_id;
            const razorpayPaymentId = refundEntity?.payment_id || paymentEntity?.id;
            const receipt = refundEntity?.notes?.orderId || paymentEntity?.notes?.orderId;

            let order = null;
            if (razorpayOrderId) {
                order = await Order.findOne({ razorpayOrderId });
            }
            if (!order && razorpayPaymentId) {
                order = await Order.findOne({ "payments.paymentId": razorpayPaymentId });
            }
            if (!order && receipt && mongoose.isValidObjectId(receipt)) {
                order = await Order.findById(receipt);
            }

            if (order) {
                order.status = "REFUNDED";
                order.refund = {
                    refundId: refundEntity?.id || null,
                    paymentId: razorpayPaymentId || null,
                    amount: (refundEntity?.amount || 0) / 100,
                    status: "processed",
                    refundedAt: new Date(),
                };
                await order.save();
                console.log(`[Razorpay Webhook] Order ${order._id} marked Refunded (${refundEntity?.id || "N/A"})`);
            }
        } else if (event === "refund.failed") {
            const refundEntity = payload?.refund?.entity;
            const paymentEntity = payload?.payment?.entity;
            const razorpayOrderId = paymentEntity?.order_id;
            const razorpayPaymentId = refundEntity?.payment_id || paymentEntity?.id;
            const receipt = refundEntity?.notes?.orderId || paymentEntity?.notes?.orderId;

            let order = null;
            if (razorpayOrderId) {
                order = await Order.findOne({ razorpayOrderId });
            }
            if (!order && razorpayPaymentId) {
                order = await Order.findOne({ "payments.paymentId": razorpayPaymentId });
            }
            if (!order && receipt && mongoose.isValidObjectId(receipt)) {
                order = await Order.findById(receipt);
            }

            if (order) {
                order.refund = {
                    refundId: refundEntity?.id || null,
                    paymentId: razorpayPaymentId || null,
                    amount: (refundEntity?.amount || 0) / 100,
                    status: "failed",
                    refundedAt: new Date(),
                };
                await order.save();
                console.log(`[Razorpay Webhook] Order ${order._id} refund attempt failed (${refundEntity?.id || "N/A"})`);
            }
        }


        res.status(200).json({ status: "ok" });
    } catch (error) {
        console.error("Razorpay Webhook Error:", error);
        res.status(500).json({ message: "Internal server error processing webhook", error: error.message });
    }
};

module.exports = {
    addOrderItems,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    cancelMyOrder,
    verifyRazorpayPayment,
    retryOrderPayment,
    handleRazorpayWebhook,
};
