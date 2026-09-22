const express = require("express");
const router = express.Router();
const {
    submitContactForm,
    getAllContactQueries,
    updateContactQueryStatus,
} = require("../controllers/contactController");
const { protect, admin } = require("../middleware/authMiddleware");

// Public inquiry submission
router.post("/", submitContactForm);

// Admin-only queries endpoints (for future queries dashboard)
router.get("/", protect, admin, getAllContactQueries);
router.patch("/:id/status", protect, admin, updateContactQueryStatus);

module.exports = router;
