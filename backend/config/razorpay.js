const Razorpay = require("razorpay");

let instance = null;

const getRazorpayInstance = () => {
    if (!instance) {
        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            throw new Error("Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing in environment variables.");
        }

        instance = new Razorpay({
            key_id,
            key_secret,
        });
    }
    return instance;
};

module.exports = { getRazorpayInstance };
