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
        });
    } else {
        res.status(404).json({ message: "User not found" });
    }
};

module.exports = {
    authUser,
    registerUser,
    getProfile,
};
