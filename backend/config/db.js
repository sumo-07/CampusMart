const mongoose = require("mongoose");

const connectDB = async () => {
    // If already connected, reuse the active connection (critical for Vercel serverless functions)
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    // If a connection attempt is currently in progress, wait for it
    if (mongoose.connection.readyState === 2) {
        return;
    }

    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGODB_URI (or MONGO_URI) is not defined in the environment variables");
        }
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
        throw error;
    }
};

module.exports = connectDB;
