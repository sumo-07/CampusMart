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
        const productData = { ...req.body };
        if (productData.price !== undefined && Number(productData.price) < 0) {
            return res.status(400).json({ message: "Price cannot be negative" });
        }
        if (productData.stock !== undefined && Number(productData.stock) < 0) {
            return res.status(400).json({ message: "Stock cannot be negative" });
        }
        // If a Cloudinary image was uploaded, ensure uploadedThumbnail & uploadedThumbnailPublicId are also populated
        if (productData.thumbnailPublicId && !productData.uploadedThumbnailPublicId) {
            productData.uploadedThumbnail = productData.thumbnail;
            productData.uploadedThumbnailPublicId = productData.thumbnailPublicId;
        }

        const product = new Product(productData);
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
            const oldUploadedPublicId = product.uploadedThumbnailPublicId || product.thumbnailPublicId;
            const updateData = { ...req.body };

            if (updateData.price !== undefined && Number(updateData.price) < 0) {
                return res.status(400).json({ message: "Price cannot be negative" });
            }
            if (updateData.stock !== undefined && Number(updateData.stock) < 0) {
                return res.status(400).json({ message: "Stock cannot be negative" });
            }

            // Determine if a new file was actually uploaded to Cloudinary
            const isNewFileUpload =
                updateData.uploadedThumbnailPublicId &&
                oldUploadedPublicId &&
                updateData.uploadedThumbnailPublicId !== oldUploadedPublicId;

            // Delete previous Cloudinary image ONLY when a new image file was uploaded to replace it
            if (isNewFileUpload) {
                deleteCloudinaryImage(oldUploadedPublicId).catch((err) =>
                    console.warn("[Cloudinary] Async cleanup failed for previous image:", err.message)
                );
            }

            // Preserve previously uploaded Cloudinary asset if admin switched to an external URL
            if (!updateData.uploadedThumbnailPublicId && product.uploadedThumbnailPublicId) {
                updateData.uploadedThumbnail = product.uploadedThumbnail;
                updateData.uploadedThumbnailPublicId = product.uploadedThumbnailPublicId;
            } else if (!updateData.uploadedThumbnailPublicId && product.thumbnailPublicId && product.thumbnail?.includes("cloudinary.com")) {
                // Backwards-compatibility for existing products
                updateData.uploadedThumbnail = product.thumbnail;
                updateData.uploadedThumbnailPublicId = product.thumbnailPublicId;
            }

            Object.assign(product, updateData);
            const updatedProduct = await product.save();

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
            const cloudinaryId = product.uploadedThumbnailPublicId || product.thumbnailPublicId;
            await Product.deleteOne({ _id: product._id });

            // If this product had an image hosted on Cloudinary, remove it
            if (cloudinaryId) {
                deleteCloudinaryImage(cloudinaryId).catch((err) =>
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
