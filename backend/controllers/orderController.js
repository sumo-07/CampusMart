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

        // 2. Handle stock reservation and expiration
        const paymentMethod = req.body.paymentMethod || "COD";
        const numericAmount = Number(calculatedTotalPrice.toFixed(2));
        const isOnlinePayment = paymentMethod === "Razorpay";

        let isStockReserved = false;
        let expiresAt = null;

        if (!isOnlinePayment) {
            // For COD: Decrement stock immediately
            for (const { product, quantity } of productsToUpdate) {
                product.stock -= quantity;
                await product.save();
            }
            isStockReserved = true;
        } else {
            // For Razorpay: Stock is NOT held in pending state; set 10-day expiration
            expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
        }

        // 3. Create and save the order with server-verified prices
        const order = new Order({
            user: req.user._id,
            orderItems: verifiedOrderItems,
            shippingAddress,
            amount: numericAmount,
            totalPrice: numericAmount,
            currency: "INR",
            status: "PENDING",
            paymentMethod: paymentMethod,
            orderStatus: isOnlinePayment ? "Pending" : "Processing",
            isStockReserved,
            expiresAt,
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
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    try {
        // 1. Auto-cleanup any pending unpaid orders that crossed their 10-day expiration
        const now = new Date();
        await Order.deleteMany({
            user: req.user._id,
            status: "PENDING",
            isStockReserved: false,
            expiresAt: { $ne: null, $lte: now }
        });

        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

        // 2. Dynamically evaluate real-time stock for pending unpaid orders
        const pendingOrders = orders.filter(o => o.status === "PENDING" && !o.isStockReserved);
        if (pendingOrders.length === 0) {
            return res.json(orders);
        }

        const productIds = [...new Set(pendingOrders.flatMap(o => o.orderItems.map(i => i.productId)))];
        const liveProducts = await Product.find({ _id: { $in: productIds } }).select("_id stock title");
        const productMap = new Map(liveProducts.map(p => [p._id.toString(), p]));

        const evaluatedOrders = orders.map(orderDoc => {
            const orderObj = orderDoc.toObject();
            if (orderObj.status === "PENDING" && !orderObj.isStockReserved) {
                let hasOutOfStockItems = false;
                orderObj.orderItems = orderObj.orderItems.map(item => {
                    const liveProd = productMap.get(item.productId.toString());
                    const availableStock = liveProd ? liveProd.stock : 0;
                    const isOutOfStock = !liveProd || availableStock < item.quantity;
                    if (isOutOfStock) hasOutOfStockItems = true;
                    return {
                        ...item,
                        isOutOfStock,
                        availableStock,
                    };
                });
                orderObj.hasOutOfStockItems = hasOutOfStockItems;
            }
            return orderObj;
        });

        res.json(evaluatedOrders);
    } catch (error) {
        console.error("Fetch Orders Error:", error);
        res.status(500).json({ message: "Server Error while fetching orders" });
    }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    try {
        const orders = await Order.find({}).populate("user", "id name email").sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Fetch All Orders Error:", error);
        res.status(500).json({ message: "Server Error while fetching all orders" });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (Admin can view any order, customer can view their own)
const getOrderById = async (req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid order ID format" });
        }

        const order = await Order.findById(req.params.id).populate("user", "id name email");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const isAdmin = Boolean(req.user && req.user.isAdmin);
        const orderUserId = order.user?._id?.toString() || order.user?.toString();
        const isOwner = Boolean(orderUserId && orderUserId === req.user._id.toString());

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: "Not authorized to view this order" });
        }

        res.json(order);
    } catch (error) {
        console.error("Get Order By ID Error:", error);
        res.status(500).json({ message: "Server error while fetching order", error: error.message });
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

        // If transitioning to Cancelled and wasn't already cancelled, restock inventory if reserved
        if (status === "Cancelled" && previousStatus !== "Cancelled") {
            if (order.isStockReserved) {
                for (const item of order.orderItems) {
                    if (mongoose.isValidObjectId(item.productId)) {
                        const product = await Product.findById(item.productId);
                        if (product) {
                            product.stock += item.quantity;
                            await product.save();
                        }
                    }
                }
                order.isStockReserved = false;
            }
            order.cancelledAt = new Date();
            const wasPaid = order.status === "PAID" || order.paymentStatus === "Paid";
            if (wasPaid) {
                order.status = "REFUNDED";
                order.paymentStatus = "Refunded";
            } else {
                order.status = "CANCELLED";
                order.paymentStatus = "Cancelled";
            }
        }

        // If reviving an order from "Cancelled" back to an active status ("Pending", "Processing", "Shipped", "Delivered")
        if (previousStatus === "Cancelled" && status !== "Cancelled") {
            // 1. Clear cancellation timestamp
            order.cancelledAt = null;

            // 2. Restore correct payment status
            const hasCapturedPayment = order.payments && order.payments.some(p => p.status === "captured");
            if (hasCapturedPayment && !order.refund?.refundId) {
                order.status = "PAID";
                order.paymentStatus = "Paid";
            } else {
                order.status = "PENDING";
                order.paymentStatus = "Pending";
            }

            // 3. Re-reserve stock from catalog if needed
            if (!order.isStockReserved) {
                for (const item of order.orderItems) {
                    if (mongoose.isValidObjectId(item.productId)) {
                        const product = await Product.findById(item.productId);
                        if (product) {
                            product.stock = Math.max(0, product.stock - item.quantity);
                            await product.save();
                        }
                    }
                }
                order.isStockReserved = true;
            }
        }

        // If marked as Delivered
        if (status === "Delivered") {
            order.deliveredAt = new Date();
            // If COD, delivery implies collection of cash
            if (order.paymentMethod === "COD" && order.status !== "PAID") {
                order.status = "PAID";
                order.paymentStatus = "Paid";
                order.payments.push({
                    method: "COD",
                    amount: order.amount,
                    currency: order.currency || "INR",
                    status: "captured",
                    capturedAt: new Date(),
                });
            }
        }

        // If reverted from Delivered to another status
        if (previousStatus === "Delivered" && status !== "Delivered") {
            order.deliveredAt = null;
        }

        order.orderStatus = status;
        const updatedOrder = await order.save();
        await updatedOrder.populate("user", "id name email");
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

        const isPaid = order.status === "PAID" || order.paymentStatus === "Paid";
        const isUnpaidRazorpay = order.paymentMethod === "Razorpay" && !isPaid;

        // If it's an unpaid Razorpay order or pending order without held stock, permanently remove from DB
        if (isUnpaidRazorpay || (!isPaid && !order.isStockReserved && order.orderStatus === "Pending")) {
            if (order.isStockReserved) {
                for (const item of order.orderItems) {
                    if (mongoose.isValidObjectId(item.productId)) {
                        const product = await Product.findById(item.productId);
                        if (product) {
                            product.stock += item.quantity;
                            await product.save();
                        }
                    }
                }
            }
            await Order.findByIdAndDelete(order._id);
            return res.json({
                message: "Pending order cancelled and removed from database",
                deletedOrderId: order._id,
                isDeleted: true,
            });
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

        // Restock products into catalog only if stock was reserved
        if (order.isStockReserved) {
            for (const item of order.orderItems) {
                if (mongoose.isValidObjectId(item.productId)) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.stock += item.quantity;
                        await product.save();
                    }
                }
            }
            order.isStockReserved = false;
        }

        order.orderStatus = "Cancelled";
        order.cancelledAt = new Date();
        if (isPaid) {
            order.status = "REFUNDED";
            order.paymentStatus = "Refunded";
        } else {
            order.status = "CANCELLED";
            order.paymentStatus = "Cancelled";
        }
        const updatedOrder = await order.save();
        await updatedOrder.populate("user", "id name email");
        res.json(updatedOrder);
    } catch (error) {
        console.error("Cancel Order Error:", error);
        res.status(500).json({ message: "Server error while cancelling order", error: error.message });
    }
};

// @desc    Explicitly delete an unpaid pending order
// @route   DELETE /api/orders/:id
// @access  Private
const deletePendingOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: "Not authorized to delete this order" });
        }

        if (order.status === "PAID") {
            return res.status(400).json({ message: "Cannot delete a paid order" });
        }

        // Restrict deletion strictly to unpaid online checkout attempts (Razorpay) in "Pending" status
        if (order.paymentMethod !== "Razorpay" || order.orderStatus !== "Pending") {
            return res.status(400).json({
                message: "Only unpaid pending Razorpay orders can be permanently deleted. Active or COD orders must be cancelled via the cancellation flow."
            });
        }

        // If stock was reserved for any reason, restock it
        if (order.isStockReserved) {
            for (const item of order.orderItems) {
                if (mongoose.isValidObjectId(item.productId)) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.stock += item.quantity;
                        await product.save();
                    }
                }
            }
            order.isStockReserved = false;
        }

        await Order.findByIdAndDelete(order._id);
        res.json({
            message: "Order removed from database",
            deletedOrderId: order._id,
            isDeleted: true,
        });
    } catch (error) {
        console.error("Delete Order Error:", error);
        res.status(500).json({ message: "Server error while deleting order", error: error.message });
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

        // Deduct inventory if not already reserved
        if (!order.isStockReserved) {
            for (const item of order.orderItems) {
                if (mongoose.isValidObjectId(item.productId)) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.stock = Math.max(0, product.stock - item.quantity);
                        await product.save();
                    }
                }
            }
            order.isStockReserved = true;
        }

        order.expiresAt = null; // Clear expiration since order is confirmed & paid

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

        // Check if order expired (10 days)
        if (order.expiresAt && order.expiresAt < new Date()) {
            await Order.findByIdAndDelete(order._id);
            return res.status(400).json({ message: "This pending order has expired and was removed." });
        }

        // Check live stock for every item in this pending order
        for (const item of order.orderItems) {
            const product = await Product.findById(item.productId);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({
                    message: !product || product.stock === 0
                        ? `Cannot proceed to payment: "${item.title}" is out of stock.`
                        : `Cannot proceed to payment: Only ${product.stock} left for "${item.title}" (need ${item.quantity}).`,
                });
            }
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
            key: process.env.RAZORPAY_KEY_ID,
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
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

                // Deduct stock if not already reserved
                if (!order.isStockReserved) {
                    for (const item of order.orderItems) {
                        if (mongoose.isValidObjectId(item.productId)) {
                            const product = await Product.findById(item.productId);
                            if (product) {
                                product.stock = Math.max(0, product.stock - item.quantity);
                                await product.save();
                            }
                        }
                    }
                    order.isStockReserved = true;
                }
                order.expiresAt = null; // Clear 10-day expiration

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
    getOrderById,
    updateOrderStatus,
    cancelMyOrder,
    deletePendingOrder,
    verifyRazorpayPayment,
    retryOrderPayment,
    handleRazorpayWebhook,
};
