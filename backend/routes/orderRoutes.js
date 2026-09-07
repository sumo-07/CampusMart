const express = require("express");
const {
    addOrderItems,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    cancelMyOrder,
} = require("../controllers/orderController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, addOrderItems).get(protect, admin, getAllOrders);
router.get("/myorders", protect, getMyOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);
router.put("/:id/cancel", protect, cancelMyOrder);

module.exports = router;
