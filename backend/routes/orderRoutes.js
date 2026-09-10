const express = require("express");
const {
    addOrderItems,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    cancelMyOrder,
    deletePendingOrder,
    verifyRazorpayPayment,
    retryOrderPayment,
    handleRazorpayWebhook,
} = require("../controllers/orderController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Razorpay specific routes
router.post("/webhook/razorpay", handleRazorpayWebhook);
router.post("/razorpay/webhook", handleRazorpayWebhook);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);
router.post("/razorpay/verify-payment", protect, verifyRazorpayPayment);
router.post("/razorpay/retry/:id", protect, retryOrderPayment);

// Compatibility alias for clients calling /razorpay/create-order
router.post("/razorpay/create-order", protect, (req, res, next) => {
    req.body.paymentMethod = "Razorpay";
    return addOrderItems(req, res, next);
});

// Order management routes
router.route("/").post(protect, addOrderItems).get(protect, admin, getAllOrders);
router.get("/myorders", protect, getMyOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);
router.put("/:id/cancel", protect, cancelMyOrder);
router.delete("/:id", protect, deletePendingOrder);

module.exports = router;

