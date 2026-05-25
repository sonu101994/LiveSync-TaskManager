const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

dotenv.config();

// function to create admin
const seedAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;
        const username = process.env.ADMIN_USERNAME?.trim() || "Admin";

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing");
        }

        if (!email || !password) {
            throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
        }

        await mongoose.connect(process.env.MONGO_URI);

        const existingAdmin = await userModel.findOne({ role: "admin" });

        if (existingAdmin) {
            console.log("admin already exists");
            await mongoose.disconnect();
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            existingUser.username = existingUser.username || username;
            existingUser.password = hashedPassword;
            existingUser.role = "admin";
            await existingUser.save();
            console.log("existing user promoted to admin");
        } else {
            await userModel.create({
                username,
                email,
                password: hashedPassword,
                role: "admin"
            });
            console.log("admin created successfully");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
};

seedAdmin();
