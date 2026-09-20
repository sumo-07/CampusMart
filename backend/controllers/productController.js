const Product = require("../models/Product");
const { uploadImageBuffer, deleteCloudinaryImage } = require("../services/cloudinaryService");

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        res.json({ products }); // Wrapped in an object to mimic dummyjson
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct("category");
        // Dummyjson returns an array of objects like [{slug: 'beauty', name: 'Beauty'}]
        const formattedCategories = categories.map((cat) => ({
            slug: cat,
            name: cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " "),
        }));
        res.json(formattedCategories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
const getProductsByCategory = async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.category });
        res.json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Upload product image to Cloudinary
// @route   POST /api/products/upload-image
// @access  Private/Admin
const uploadProductImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        const result = await uploadImageBuffer(req.file.buffer, "campusMart/products");
        res.status(200).json({
            message: "Image uploaded successfully",
            url: result.url,
            publicId: result.publicId,
        });
    } catch (error) {
        console.error("Upload Product Image Error:", error);
        res.status(500).json({
            message: error.message || "Failed to upload image to Cloudinary",
        });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            const oldThumbnailPublicId = product.thumbnailPublicId;
            const newThumbnail = req.body.thumbnail;
            const newThumbnailPublicId = req.body.thumbnailPublicId;

            // Check if image changed
            const imageChanged =
                (newThumbnail && newThumbnail !== product.thumbnail) ||
                (newThumbnailPublicId !== undefined && newThumbnailPublicId !== oldThumbnailPublicId);

            Object.assign(product, req.body);
            const updatedProduct = await product.save();

            // Only delete the old image if it was previously hosted on Cloudinary and was replaced
            if (imageChanged && oldThumbnailPublicId && oldThumbnailPublicId !== updatedProduct.thumbnailPublicId) {
                deleteCloudinaryImage(oldThumbnailPublicId).catch((err) =>
                    console.warn("[Cloudinary] Async cleanup failed for previous image:", err.message)
                );
            }

            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            const thumbnailPublicId = product.thumbnailPublicId;
            await Product.deleteOne({ _id: product._id });

            // If this product had an image hosted on Cloudinary, remove it
            if (thumbnailPublicId) {
                deleteCloudinaryImage(thumbnailPublicId).catch((err) =>
                    console.warn("[Cloudinary] Async deletion failed on product delete:", err.message)
                );
            }

            res.json({ message: "Product removed" });
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Seed or sync products from DummyJSON
// @route   POST /api/products/seed
// @access  Private/Admin
const seedProductsCatalog = async (req, res) => {
    try {
        const { syncCatalog } = require("../services/seederService");
        const isClean = req.body?.clean === true;
        const result = await syncCatalog({ clean: isClean });
        res.json({
            message: "Products catalog synced successfully",
            ...result,
        });
    } catch (error) {
        console.error("Seed Catalog Error:", error);
        res.status(500).json({ message: "Failed to sync products catalog", error: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    getCategories,
    getProductsByCategory,
    createProduct,
    uploadProductImage,
    updateProduct,
    deleteProduct,
    seedProductsCatalog,
};
