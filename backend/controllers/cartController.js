const User = require("../models/User");

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
    const { productId, title, price, thumbnail, quantity } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const itemIndex = user.cart.findIndex(
                (item) => String(item.productId) === String(productId)
            );

            if (itemIndex > -1) {
                user.cart[itemIndex].quantity += quantity || 1;
            } else {
                user.cart.push({
                    productId,
                    title,
                    price,
                    thumbnail,
                    quantity: quantity || 1,
                });
            }

            await user.save();
            res.status(201).json(user.cart);
        } else {
            res.status(404).json({ message: "User not found" });
        }
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

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const itemIndex = user.cart.findIndex(
                (item) => String(item.productId) === String(req.params.productId)
            );

            if (itemIndex > -1) {
                if (action === "inc") {
                    user.cart[itemIndex].quantity += 1;
                } else if (action === "dec") {
                    user.cart[itemIndex].quantity -= 1;
                    if (user.cart[itemIndex].quantity <= 0) {
                        user.cart.splice(itemIndex, 1);
                    }
                }

                await user.save();
                res.json(user.cart);
            } else {
                res.status(404).json({ message: "Item not found in cart" });
            }
        } else {
            res.status(404).json({ message: "User not found" });
        }
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
