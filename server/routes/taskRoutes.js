const express = require("express");
const router = express.Router();

// Task controller functions
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  addUser,removeUser
} = require("../controller/taskController");

// Auth middleware
const protect = require("../middleware/authMiddleware");

// Create new task
router.post("/", protect, createTask);

// Get all tasks
router.get("/", protect, getTasks);

// Update task
router.put("/:id", protect, updateTask);

// Delete task
router.delete("/:id", protect, deleteTask);

// Add user to task
router.put("/:id/add-user", protect, addUser);
router.put("/:id/remove-user", protect, removeUser);

module.exports = router;