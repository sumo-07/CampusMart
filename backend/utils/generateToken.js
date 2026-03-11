const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: "30d",
    });
};

module.exports = generateToken;
