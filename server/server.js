// env setup
const dotenv = require("dotenv");
dotenv.config();

//  installed packages
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// routes
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

// ================= CREATED EXPRESS APP (handles api's,routes and middleware)=================
const app = express();

//HTTP SERVER 
const server = http.createServer(app);



//  allowed origins
const allowedOrigins = (process.env.CLIENT_URL || "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("not allowed by cors"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
};

// SOCKET.IO SETUP 
const io = new Server(server, {
    cors: {
        origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Global access
global.io = io;

// SOCKET CONNECTION
io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });

});

// ================= MIDDLEWARE FOR REQUESTS BETWEEN CLIENT AND SERVER =================
app.use(cors(corsOptions));

app.use(express.json());


// ROUTES 
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// STATIC FRONTEND 
app.use(express.static(path.join(__dirname, "../client")));


// port 
const PORT = process.env.PORT || 5000;


// database connection and server starting
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database connected!");

        // ================= STARTING SERVER =================
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.log("Database connection failed:", err.message);
        process.exit(1);
    }
};

startServer();
