const express = require("express");
const {
    authUser,
    registerUser,
    getProfile,
    addUserAddress,
    updateUserAddress,
    deleteUserAddress,
    setDefaultAddress,
    logoutUser,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", authUser);
router.post("/logout", logoutUser);
router.get("/profile", protect, getProfile);
router.post("/address", protect, addUserAddress);
router.put("/address/:id", protect, updateUserAddress);
router.delete("/address/:id", protect, deleteUserAddress);
router.put("/address/default/:id", protect, setDefaultAddress);

module.exports = router;
