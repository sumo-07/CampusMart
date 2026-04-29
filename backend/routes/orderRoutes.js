const express = require("express");
const { addOrderItems, getMyOrders, getAllOrders } = require("../controllers/orderController");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, addOrderItems).get(protect, admin, getAllOrders);
router.get("/myorders", protect, getMyOrders);

module.exports = router;
