require("./config/env");
const dns = require("dns");
// Force IPv4 DNS resolution first to prevent ENETUNREACH errors on cloud hosts like Render
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}
const path = require("path");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const contactRoutes = require("./routes/contactRoutes");
const { handleRazorpayWebhook } = require("./controllers/orderController");

const app = express();

// Trust reverse proxy for HTTPS cookie transmission on Render/Vercel
app.set("trust proxy", 1);

const rawOrigins = [
    process.env.URL,
    process.env.CLIENT_URL,
    "http://localhost:5173",
].filter(Boolean);

const allowedOrigins = rawOrigins
    .flatMap((entry) => entry.split(","))
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
        if (!origin) return callback(null, true);

        const cleanOrigin = origin.replace(/\/$/, "");
        const isAllowed = allowedOrigins.includes(cleanOrigin) ||
            cleanOrigin.endsWith(".vercel.app");

        if (isAllowed) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
}));


app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(cookieParser());

// Health check endpoint for cloud platforms (e.g. Render)
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/contact", contactRoutes);

// Webhook route aliases for Razorpay
app.post("/api/webhook/razorpay", handleRazorpayWebhook);
app.post("/api/razorpay/webhook", handleRazorpayWebhook);
app.post("/api/webhook", handleRazorpayWebhook);

// Error Handling Middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        console.error("Bad JSON received:", err.message);
        return res.status(400).send({ message: "Invalid JSON format" });
    }
    console.error("Unhandled Error:", err.stack);
    res.status(500).send({ message: "Something went wrong" });
});

// Serve static frontend build if it exists (Railway unified full-stack deployment)
const frontendDistPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.use((req, res, next) => {
        if (req.method === "GET" && !req.path.startsWith("/api")) {
            return res.sendFile(path.join(frontendDistPath, "index.html"));
        }
        next();
    });
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();
