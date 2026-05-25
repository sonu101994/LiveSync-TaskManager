const taskModel = require("../models/taskModel");
const userModel = require("../models/userModel");

const allowedStatuses = ["backlog", "pending", "in-progress", "completed"];
const allowedPriorities = ["low", "medium", "high"];

// ================= CREATE TASK =================
const createTask = async (req, res) => {
    try {

        const { description, priority, dueDate } = req.body;
        const title = req.body.title?.trim();

        if (!title) {
            return res.status(400).json({
                message: "title is required"
            });
        }

        if (priority && !allowedPriorities.includes(priority)) {
            return res.status(400).json({
                message: "invalid priority"
            });
        }

        const task = await taskModel.create({
            title,
            description,
            priority: priority || "medium",
            dueDate: dueDate || undefined,
            createdBy: req.user._id,
            users: []
        });

        // REALTIME UPDATE
        global.io.emit("tasksUpdated");

        res.status(201).json(task);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

// ================= GET TASKS =================
const getTasks = async (req, res) => {

    try {

        let tasks;

        if (req.user.role === "admin") {

            tasks = await taskModel
                .find()
                .populate("createdBy", "username email")
                .populate("users", "username email")
                .sort({ createdAt: -1 });

        } else {

            tasks = await taskModel
                .find({
                    $or: [
                        { createdBy: req.user._id },
                        { users: req.user._id }
                    ]
                })
                .populate("createdBy", "username email")
                .populate("users", "username email")
                .sort({ createdAt: -1 });

        }

        res.json(tasks);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

// ================= UPDATE TASK =================
const updateTask = async (req, res) => {

    try {

        const task = await taskModel.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        const isAssigned = task.users.some(
            (u) => String(u) === String(req.user._id)
        );

        const canManageTask =
            req.user.role === "admin" ||
            String(task.createdBy) === String(req.user._id);

        if (!canManageTask && !isAssigned) {

            return res.status(403).json({
                message: "Not allowed"
            });

        }

        // assigned users can only update task status
        if (!canManageTask) {
            const fields = Object.keys(req.body);
            const onlyStatusUpdate =
                fields.length === 1 && fields[0] === "status";

            if (!onlyStatusUpdate) {
                return res.status(403).json({
                    message: "Assigned users can only move task status"
                });
            }
        }

        if (req.body.status && !allowedStatuses.includes(req.body.status)) {
            return res.status(400).json({
                message: "invalid status"
            });
        }

        if (req.body.priority && !allowedPriorities.includes(req.body.priority)) {
            return res.status(400).json({
                message: "invalid priority"
            });
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
            const title = req.body.title?.trim();

            if (!title) {
                return res.status(400).json({
                    message: "title is required"
                });
            }

            task.title = title;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
            task.description = req.body.description || "";
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
            task.status = req.body.status;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "priority")) {
            task.priority = req.body.priority;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "dueDate")) {
            task.dueDate = req.body.dueDate || undefined;
        }

        const updatedTask = await task.save();

        // REALTIME UPDATE
        global.io.emit("tasksUpdated");

        res.json(updatedTask);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

// ================= DELETE TASK =================
const deleteTask = async (req, res) => {

    try {

        const task = await taskModel.findById(req.params.id);

        if (!task) {

            return res.status(404).json({
                message: "Task not found"
            });

        }

        if (
            task.createdBy.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {

            return res.status(403).json({
                message: "Not allowed"
            });

        }

        await task.deleteOne();

        // REALTIME UPDATE
        global.io.emit("tasksUpdated");

        res.json({
            message: "Task removed"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

// ================= ADD USER =================
const addUser = async (req, res) => {

    try {

        const email = req.body.email?.trim().toLowerCase();

        if (!email) {
            return res.status(400).json({
                message: "email is required"
            });
        }

        const task = await taskModel.findById(req.params.id);

        if (!task) {

            return res.status(404).json({
                message: "Task not found"
            });

        }

        if (
            task.createdBy.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {

            return res.status(403).json({
                message: "Not allowed"
            });

        }

        const user = await userModel.findOne({ email });

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });

        }

        const alreadyAdded = task.users.some(
            (u) => u.toString() === user._id.toString()
        );

        if (alreadyAdded) {

            return res.status(400).json({
                message: "Already added"
            });

        }

        task.users.push(user._id);

        await task.save();

        // REALTIME UPDATE
        global.io.emit("tasksUpdated");

        res.json({
            message: "User added",
            task
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

// ================= REMOVE USER =================
const removeUser = async (req, res) => {

    try {

        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "user id is required"
            });
        }

        const task = await taskModel.findById(req.params.id);

        if (!task) {

            return res.status(404).json({
                message: "Task not found"
            });

        }

        // Only creator or admin
        if (
            task.createdBy.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {

            return res.status(403).json({
                message: "Not allowed"
            });

        }

        const isAssigned = task.users.some(
            (u) => u.toString() === userId.toString()
        );

        // Check if user exists in task
        if (!isAssigned) {

            return res.status(400).json({
                message: "User not assigned"
            });

        }

        // Remove user
        task.users = task.users.filter(
            (u) => u.toString() !== userId
        );

        await task.save();

        // REALTIME UPDATE
        global.io.emit("tasksUpdated");

        res.json({
            message: "User removed",
            task
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    addUser,
    removeUser
};
