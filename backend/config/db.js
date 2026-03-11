const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb+srv://sumo_new1:sumo_new1@cluster0.bdofqr.mongodb.net/campusMart";
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
