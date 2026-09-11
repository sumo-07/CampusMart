require("./config/env");

const mongoose = require("mongoose");
const { syncCatalog } = require("./services/seederService");

const runSeed = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not set. Please check backend/.env");
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected successfully to MongoDB.");

        const isClean = process.argv.includes("--clean");
        const result = await syncCatalog({ clean: isClean });

        console.log("Seeding finished successfully:", result);
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
        process.exit(0);
    } catch (error) {
        console.error("Error during seeding:", error.message);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
};

runSeed();
