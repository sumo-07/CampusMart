const express = require("express");
const {
    authUser,
    registerUser,
    getProfile,
    addUserAddress,
    setDefaultAddress,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", authUser);
router.get("/profile", protect, getProfile);
router.post("/address", protect, addUserAddress);
router.put("/address/default/:id", protect, setDefaultAddress);

module.exports = router;
