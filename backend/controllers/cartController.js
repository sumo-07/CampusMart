const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");

// Maximum allowed purchase quantity per product per order/cart
const MAX_ITEM_QUANTITY = 5;

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json(user.cart);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("getCart Error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || !mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: "Invalid or missing product ID" });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    if (qty > MAX_ITEM_QUANTITY) {
        return res.status(400).json({
            message: `Maximum ${MAX_ITEM_QUANTITY} units allowed per item.`,
        });
    }

    try {
        const [user, product] = await Promise.all([
            User.findById(req.user._id),
            Product.findById(productId),
        ]);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Check if product is in stock
        if (product.stock <= 0) {
            return res.status(400).json({ message: `"${product.title}" is out of stock` });
        }

        const itemIndex = user.cart.findIndex(
            (item) => String(item.productId) === String(productId)
        );

        if (itemIndex > -1) {
            const currentQty = user.cart[itemIndex].quantity;
            const nextQty = currentQty + qty;

            if (nextQty > MAX_ITEM_QUANTITY) {
                return res.status(400).json({
                    message: `You can only purchase up to ${MAX_ITEM_QUANTITY} units of "${product.title}" (${currentQty} already in your cart).`,
                });
            }

            if (nextQty > product.stock) {
                return res.status(400).json({
                    message: `Cannot add more. Only ${product.stock} available in stock (${currentQty} already in your cart).`,
                });
            }

            user.cart[itemIndex].quantity = nextQty;
            // Always synchronize with authoritative DB price, title, and thumbnail
            user.cart[itemIndex].title = product.title;
            user.cart[itemIndex].price = product.price;
            user.cart[itemIndex].thumbnail = product.thumbnail;
        } else {
            if (qty > product.stock) {
                return res.status(400).json({
                    message: `Cannot add ${qty} units. Only ${product.stock} available in stock.`,
                });
            }

            // Always use verified database values rather than trusting client body
            user.cart.push({
                productId: product._id.toString(),
                title: product.title,
                price: product.price,
                thumbnail: product.thumbnail,
                quantity: qty,
            });
        }

        await user.save();
        res.status(201).json(user.cart);
    } catch (error) {
        console.error("addToCart Error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.cart = user.cart.filter(
                (item) => String(item.productId) !== String(req.params.productId)
            );

            await user.save();
            res.json(user.cart);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("removeFromCart Error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartQuantity = async (req, res) => {
    const { action } = req.body; // 'inc' or 'dec'
    const { productId } = req.params;

    if (!action || !["inc", "dec"].includes(action)) {
        return res.status(400).json({ message: "Action must be 'inc' or 'dec'" });
    }

    if (!productId || !mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: "Invalid product ID format" });
    }

    try {
        const [user, product] = await Promise.all([
            User.findById(req.user._id),
            Product.findById(productId),
        ]);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const itemIndex = user.cart.findIndex(
            (item) => String(item.productId) === String(productId)
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        if (action === "inc") {
            if (!product) {
                // If product was deleted from DB, purge it from cart
                user.cart.splice(itemIndex, 1);
                await user.save();
                return res.status(404).json({ message: "Product no longer exists and has been removed from your cart" });
            }

            if (product.stock <= 0) {
                return res.status(400).json({ message: `"${product.title}" is out of stock` });
            }

            const nextQty = user.cart[itemIndex].quantity + 1;

            if (nextQty > MAX_ITEM_QUANTITY) {
                return res.status(400).json({
                    message: `Maximum ${MAX_ITEM_QUANTITY} units allowed per item.`,
                });
            }

            if (nextQty > product.stock) {
                return res.status(400).json({
                    message: `Cannot add more. Only ${product.stock} available in stock.`,
                });
            }

            user.cart[itemIndex].quantity = nextQty;
            // Synchronize authoritative DB details
            user.cart[itemIndex].title = product.title;
            user.cart[itemIndex].price = product.price;
            user.cart[itemIndex].thumbnail = product.thumbnail;
        } else if (action === "dec") {
            user.cart[itemIndex].quantity -= 1;
            if (user.cart[itemIndex].quantity <= 0) {
                user.cart.splice(itemIndex, 1);
            } else if (product) {
                // Ensure quantity does not exceed current stock if stock was lowered by admin
                if (user.cart[itemIndex].quantity > product.stock) {
                    user.cart[itemIndex].quantity = product.stock;
                }
                user.cart[itemIndex].title = product.title;
                user.cart[itemIndex].price = product.price;
                user.cart[itemIndex].thumbnail = product.thumbnail;
            }
        }

        await user.save();
        res.json(user.cart);
    } catch (error) {
        console.error("updateCartQuantity Error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

const clearCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.cart = [];
            await user.save();
            res.json(user.cart);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("clearCart Error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
};
