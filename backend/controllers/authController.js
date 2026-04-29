const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            addresses: user.addresses,
            token: generateToken(user._id),
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
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            addresses: user.addresses,
            token: generateToken(user._id),
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

module.exports = {
    authUser,
    registerUser,
    getProfile,
    addUserAddress,
    setDefaultAddress,
};
