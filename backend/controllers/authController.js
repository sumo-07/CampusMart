const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendPasswordResetEmail } = require("../utils/emailService");
const { OAuth2Client } = require("google-auth-library");

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

// @desc    Authenticate user with Google OAuth credential token
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: "No Google credential provided" });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.error("[Google Auth] GOOGLE_CLIENT_ID is not configured in backend/.env");
            return res.status(500).json({ message: "Google authentication is not configured on the server" });
        }

        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ message: "Failed to extract user profile from Google token" });
        }

        const { sub: googleId, email, name, picture } = payload;

        // Check if user exists by googleId or email
        let user = await User.findOne({
            $or: [{ googleId }, { email: email.toLowerCase() }],
        });

        if (user) {
            // Link googleId or avatar if they weren't linked yet
            let modified = false;
            if (!user.googleId) {
                user.googleId = googleId;
                modified = true;
            }
            if (!user.avatar && picture) {
                user.avatar = picture;
                modified = true;
            }
            if (modified) {
                await user.save();
            }
        } else {
            // Create a new user with Google details
            user = await User.create({
                name: name || "Google User",
                email: email.toLowerCase(),
                googleId,
                avatar: picture || "",
                isAdmin: false,
            });
        }

        const token = generateToken(user._id);
        sendTokenCookie(res, token);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            addresses: user.addresses,
            avatar: user.avatar,
        });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({
            message: "Google authentication failed",
            error: error.message,
        });
    }
};

// @desc    Request password reset (generates 6-digit OTP & reset token link)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Please provide your email address" });
        }

        const cleanEmail = email.trim();
        const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
        });

        if (!user) {
            return res.status(404).json({
                message: "No account found with this email address. Please make sure you have registered first.",
            });
        }

        // Generate secure random 6-digit OTP (100000 - 999999)
        const rawOtp = crypto.randomInt(100000, 1000000).toString();

        // Generate 32-byte hex reset token for one-click URL reset
        const rawToken = crypto.randomBytes(32).toString("hex");

        // Hash both before persisting to database
        const hashedOtp = crypto.createHash("sha256").update(rawOtp).digest("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        // Set 15-minute expiration timestamp
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        user.resetPasswordOtp = hashedOtp;
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = expiresAt;

        await user.save({ validateBeforeSave: false });

        // Dispatch email with both 6-digit OTP and direct reset link
        await sendPasswordResetEmail({
            recipientEmail: user.email,
            customerName: user.name,
            otp: rawOtp,
            resetToken: rawToken,
            clientUrl: process.env.URL || process.env.CLIENT_URL,
        });

        return res.status(200).json({
            success: true,
            message: "Password reset instructions have been sent to your email.",
            email: user.email,
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ message: "Failed to process forgot password request", error: error.message });
    }
};

// @desc    Verify OTP code or reset token prior to password submission
// @route   POST /api/auth/verify-reset-code
// @access  Public
const verifyResetCode = async (req, res) => {
    try {
        const { email, otp, token } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        if (!otp && !token) {
            return res.status(400).json({ message: "Please provide the 6-digit verification code or reset token" });
        }

        const cleanEmail = email.trim();
        const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
        });

        if (!user) {
            return res.status(404).json({ message: "No account found with this email address." });
        }

        if (!user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({
                message: "This reset link or verification code has expired (valid for 15 minutes). Please request a new one.",
                expired: true,
            });
        }

        let isValid = false;
        if (otp) {
            const cleanOtp = String(otp).trim();
            const hashedOtp = crypto.createHash("sha256").update(cleanOtp).digest("hex");
            if (user.resetPasswordOtp && user.resetPasswordOtp === hashedOtp) {
                isValid = true;
            }
        } else if (token) {
            const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");
            if (user.resetPasswordToken && user.resetPasswordToken === hashedToken) {
                isValid = true;
            }
        }

        if (!isValid) {
            return res.status(400).json({ message: "Invalid verification code or reset link" });
        }

        return res.status(200).json({ success: true, message: "Verification code is valid" });
    } catch (error) {
        console.error("Verify reset code error:", error);
        return res.status(500).json({ message: "Failed to verify reset code", error: error.message });
    }
};

// @desc    Reset password using valid 6-digit OTP or reset token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { email, otp, token, newPassword } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        if (!otp && !token) {
            return res.status(400).json({ message: "Verification code or reset token is required" });
        }

        const cleanEmail = email.trim();
        const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${escapedEmail}$`, "i") },
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                message: "The password reset link or verification code has expired or is invalid. Please request a new one.",
            });
        }

        let isVerified = false;
        if (otp) {
            const cleanOtp = String(otp).trim();
            const hashedOtp = crypto.createHash("sha256").update(cleanOtp).digest("hex");
            if (user.resetPasswordOtp && user.resetPasswordOtp === hashedOtp) {
                isVerified = true;
            }
        } else if (token) {
            const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");
            if (user.resetPasswordToken && user.resetPasswordToken === hashedToken) {
                isVerified = true;
            }
        }

        if (!isVerified) {
            return res.status(400).json({ message: "Invalid verification code or reset token" });
        }

        // Set new password (bcrypt pre-save hook on User schema will hash this)
        user.password = newPassword;

        // Clear reset tokens
        user.resetPasswordToken = undefined;
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Your password has been successfully reset! You can now log in.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Failed to reset password", error: error.message });
    }
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
    googleAuth,
    forgotPassword,
    verifyResetCode,
    resetPassword,
};

