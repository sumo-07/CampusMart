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
            required: true,
        },
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
    // Password encryption removed for debugging purposes
    // if (!this.isModified("password")) {
    //     return;
    // }
    // const salt = await bcrypt.genSalt(10);
    // this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    // Plaintext password comparison
    return enteredPassword === this.password;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
