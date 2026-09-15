const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const sendTokenCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        const token = generateToken(user._id);
        sendTokenCookie(res, token);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            addresses: user.addresses,
        });
    } else {
        res.status(401).json({ message: "Invalid email or password" });
    }
};

// @desc    Register a new user (Signup)
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: "User already exists" });
        return;
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (user) {
        const token = generateToken(user._id);
        sendTokenCookie(res, token);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            addresses: user.addresses,
        });
    } else {
        res.status(400).json({ message: "Invalid user data" });
    }
};

const getProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            addresses: user.addresses,
        });
    } else {
        res.status(404).json({ message: "User not found" });
    }
};

// @desc    Add user address
// @route   POST /api/auth/address
// @access  Private
const addUserAddress = async (req, res) => {
    const { fullName, address, city, pincode, phone } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            // First address added automatically becomes default
            const isDefault = user.addresses.length === 0;
            const newAddress = { fullName, address, city, pincode, phone, isDefault };
            user.addresses.push(newAddress);
            await user.save();
            res.status(201).json(user.addresses);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error saving address", error);
        res.status(500).json({ message: "Error adding address", error: error.message });
    }
};

// @desc    Set default address
// @route   PUT /api/auth/address/default/:id
// @access  Private
const setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            const addressId = req.params.id;
            let found = false;

            user.addresses.forEach((addr) => {
                if (addr._id.toString() === addressId) {
                    addr.isDefault = true;
                    found = true;
                } else {
                    addr.isDefault = false;
                }
            });

            if (!found) {
                return res.status(404).json({ message: "Address not found" });
            }

            await user.save();
            res.status(200).json(user.addresses);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error setting default address", error);
        res.status(500).json({ message: "Error setting default address", error: error.message });
    }
};

// @desc    Update user address
// @route   PUT /api/auth/address/:id
// @access  Private
const updateUserAddress = async (req, res) => {
    const { id } = req.params;
    const { fullName, address, city, pincode, phone, isDefault } = req.body;

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const addressSubdoc = user.addresses.id ? user.addresses.id(id) : null;
        const targetAddress = addressSubdoc || user.addresses.find((a) => a._id.toString() === id);

        if (!targetAddress) {
            return res.status(404).json({ message: "Address not found" });
        }

        if (fullName !== undefined) targetAddress.fullName = fullName;
        if (address !== undefined) targetAddress.address = address;
        if (city !== undefined) targetAddress.city = city;
        if (pincode !== undefined) targetAddress.pincode = pincode;
        if (phone !== undefined) targetAddress.phone = phone;

        if (isDefault !== undefined && isDefault) {
            user.addresses.forEach((addr) => {
                addr.isDefault = addr._id.toString() === id;
            });
        }

        await user.save();
        res.status(200).json(user.addresses);
    } catch (error) {
        console.error("Error updating address", error);
        res.status(500).json({ message: "Error updating address", error: error.message });
    }
};

// @desc    Delete user address
// @route   DELETE /api/auth/address/:id
// @access  Private
const deleteUserAddress = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === id);
        if (addressIndex === -1) {
            return res.status(404).json({ message: "Address not found" });
        }

        const wasDefault = user.addresses[addressIndex].isDefault;
        user.addresses.splice(addressIndex, 1);

        // If the deleted address was default, make the first remaining address default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        res.status(200).json(user.addresses);
    } catch (error) {
        console.error("Error deleting address", error);
        res.status(500).json({ message: "Error deleting address", error: error.message });
    }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: "Logged out successfully" });
};

module.exports = {
    authUser,
    registerUser,
    getProfile,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultAddress,
    logoutUser,
};
