// ================= env setup =================
const dotenv = require("dotenv");
dotenv.config();

// ================= IMPORTS INSTALLED PACKAGES =================
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// ================= ROUTES =================
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

// ================= CREATED EXPRESS APP (handles api's,routes and middleware)=================
const app = express();

// ================= HTTP SERVER ==========
const server = http.createServer(app);

// ================= SOCKET.IO SETUP ==============
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Global access
global.io = io;

// ============ SOCKET CONNECTION =============
io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });

});

// ================= MIDDLEWARE FOR REQUESTS BETWEEN CLIENT AND SERVER =================
app.use(cors({
    origin: "*"
}));

app.use(express.json());


// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// ================= STATIC FRONTEND =================
app.use(express.static(path.join(__dirname, "../client")));

// ================= DATABASE CONNECTION =================
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Database connected!");
    })
    .catch((err) => {
        console.log("Database connection failed:", err);
    });

// ================= STARTING SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});