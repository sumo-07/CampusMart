const express = require("express");
const { addOrderItems, getMyOrders } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, addOrderItems);
router.get("/myorders", protect, getMyOrders);

module.exports = router;
