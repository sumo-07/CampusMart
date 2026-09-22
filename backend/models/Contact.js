const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxLength: [100, "Name cannot exceed 100 characters"],
        },
        email: {
            type: String,
            required: [true, "Email address is required"],
            trim: true,
            lowercase: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email address",
            ],
        },
        phone: {
            type: String,
            trim: true,
            maxLength: [20, "Phone number cannot exceed 20 characters"],
            default: "",
        },
        subject: {
            type: String,
            trim: true,
            maxLength: [150, "Subject cannot exceed 150 characters"],
            default: "General Inquiry",
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            maxLength: [3000, "Message cannot exceed 3000 characters"],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        status: {
            type: String,
            enum: ["Pending", "Resolved", "Archived"],
            default: "Pending",
        },
    },
    {
        timestamps: true,
    }
);

contactSchema.index({ createdAt: -1 });
contactSchema.index({ status: 1 });

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
