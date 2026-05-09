
// Import dependencies
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// ================= AUTH MIDDLEWARE =================
const protect = async (req, res, next) => {
    let token;

    try {
        // Check for Bearer token
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            // Extract token
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to request (exclude password)
            req.user = await userModel
                .findById(decoded.id)
                .select("-password");

            next();
        } else {
            // No token provided
            res.status(401).json({
                message: "Not authorized, no token"
            });
        }

    } catch (error) {
        // Invalid or expired token
        res.status(401).json({
            message: "Token failed"
        });
    }
};

// Export middleware
module.exports = protect;