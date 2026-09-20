const express = require("express");
const router = express.Router();
const {
    getProducts,
    getProductById,
    getCategories,
    getProductsByCategory,
    createProduct,
    uploadProductImage,
    updateProduct,
    deleteProduct,
    seedProductsCatalog,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.route("/").get(getProducts).post(protect, admin, createProduct);
router.post("/upload-image", protect, admin, upload.single("image"), uploadProductImage);
router.post("/seed", protect, admin, seedProductsCatalog);
router.route("/categories").get(getCategories);
router.route("/category/:category").get(getProductsByCategory);
router
    .route("/:id")
    .get(getProductById)
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct);

module.exports = router;
