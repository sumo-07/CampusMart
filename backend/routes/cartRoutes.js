const express = require("express");
const {
    getCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getCart);
router.post("/add", protect, addToCart); // Add to cart using precise instruction POST /api/cart/add
router.delete("/", protect, clearCart);

router.delete("/:productId", protect, removeFromCart);
router.put("/:productId", protect, updateCartQuantity);

module.exports = router;
