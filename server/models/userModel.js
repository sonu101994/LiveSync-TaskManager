
// Import mongoose
const mongoose = require("mongoose");

// ================= USER SCHEMA =================
const userSchema = new mongoose.Schema(
    {
        // Username
        username: {
            type: String,
            required: true,
            trim: true
        },

        // User role
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        // Email (unique)
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        // Hashed password
        password: {
            type: String,
            required: true
        },
    },
    {
        timestamps: true // createdAt & updatedAt
    }
);

// Create model
const userModel = mongoose.model("User", userSchema);

// Export model
module.exports = userModel;