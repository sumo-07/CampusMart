const express = require("express");
const router = express.Router();
const {
    getProducts,
    getProductById,
    getCategories,
    getProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/").get(getProducts).post(protect, admin, createProduct);
router.route("/categories").get(getCategories);
router.route("/category/:category").get(getProductsByCategory);
router
    .route("/:id")
    .get(getProductById)
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct);

module.exports = router;
