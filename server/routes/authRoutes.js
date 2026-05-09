
// Import express
const express = require("express");
const router = express.Router();

// Import auth controllers
const { registerUser, loginUser } = require("../controller/authController");

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Export router
module.exports = router;