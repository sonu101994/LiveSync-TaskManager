
// Import mongoose
const mongoose = require("mongoose");

// ================= TASK SCHEMA =================
const taskSchema = new mongoose.Schema({

    // Task title
    title: {
        type: String,
        required: true,
    },

    // Optional description
    description: String,

    // Task status
    status: {
        type: String,
        enum: ["backlog", "pending", "in-progress", "completed"],
        default: "backlog",
    },

    // Priority level
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
    },

    // Deadline
    dueDate: Date,

    // Assigned users
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],

    // Task creator
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }

}, { timestamps: true });

// Create model
const taskModel = mongoose.model("Task", taskSchema);

// Export model
module.exports = taskModel;