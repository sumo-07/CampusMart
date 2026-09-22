const Contact = require("../models/Contact");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendDiscordContactAlert } = require("../utils/discordService");

/**
 * @desc    Submit student contact inquiry
 * @route   POST /api/contact
 * @access  Public
 */
const submitContactForm = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Please provide your full name" });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ message: "Please provide your email address" });
        }
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }
        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Please provide a message or question" });
        }

        // Optional authenticated user resolution
        let userId = null;
        let token = req.cookies?.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded?.id) {
                    userId = decoded.id;
                }
            } catch (_) {
                // Token invalid or expired; continue as guest submission
            }
        }

        const contact = await Contact.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : "",
            subject: subject ? subject.trim() : "General Inquiry",
            message: message.trim(),
            user: userId,
            status: "Pending",
        });

        // Non-blocking dispatch to dedicated Discord support channel
        sendDiscordContactAlert(contact).catch((err) =>
            console.error("[ContactController] Error sending Discord contact alert:", err.message)
        );

        res.status(201).json({
            message: "Your message has been sent successfully! Our customer support team will get back to you shortly.",
            contactId: contact._id,
        });
    } catch (error) {
        console.error("[ContactController] Error submitting contact form:", error);
        res.status(500).json({ message: "Server error while sending message", error: error.message });
    }
};

/**
 * @desc    Get all contact queries (Admin Dashboard)
 * @route   GET /api/contact
 * @access  Private/Admin
 */
const getAllContactQueries = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) {
            filter.status = status;
        }

        const queries = await Contact.find(filter)
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.json({ count: queries.length, queries });
    } catch (error) {
        console.error("[ContactController] Error fetching queries:", error);
        res.status(500).json({ message: "Server error fetching queries", error: error.message });
    }
};

/**
 * @desc    Update query status (Pending -> Resolved)
 * @route   PATCH /api/contact/:id/status
 * @access  Private/Admin
 */
const updateContactQueryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["Pending", "Resolved", "Archived"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const query = await Contact.findById(req.params.id);
        if (!query) {
            return res.status(404).json({ message: "Inquiry not found" });
        }

        query.status = status;
        await query.save();

        res.json({ message: `Query status updated to ${status}`, query });
    } catch (error) {
        console.error("[ContactController] Error updating query status:", error);
        res.status(500).json({ message: "Server error updating query status", error: error.message });
    }
};

module.exports = {
    submitContactForm,
    getAllContactQueries,
    updateContactQueryStatus,
};
