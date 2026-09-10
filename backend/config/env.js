const path = require("path");
const dotenv = require("dotenv");

// Load .env relative to the backend directory so it loads regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// Fallback to cwd .env if any
dotenv.config();
