const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: false,
        },
        googleId: {
            type: String,
            default: null,
        },
        avatar: {
            type: String,
            default: "",
        },
        isAdmin: {
            type: Boolean,
            required: true,
            default: false,
        },
        addresses: [
            {
                fullName: { type: String, required: true },
                address: { type: String, required: true },
                city: { type: String, required: true },
                pincode: { type: String, required: true },
                phone: { type: String, required: true },
                isDefault: { type: Boolean, default: false }
            }
        ],
        cart: [
            {
                productId: {
                    type: String,
                    required: true,
                },
                title: String,
                price: Number,
                thumbnail: String,
                quantity: {
                    type: Number,
                    required: true,
                    default: 1,
                    min: 1,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
