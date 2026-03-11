const express = require("express");
const {
    authUser,
    registerUser,
    getProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", authUser);
router.get("/profile", protect, getProfile);

module.exports = router;
