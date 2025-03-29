const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./src/models/User"); 
require("dotenv").config();
const app = require('./src/app');

app.use(express.json());


const allowedOrigins = ["http://localhost:5173", "https://aicodereviewer.vercel.app"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // ✅ Allow cookies and authentication headers
  methods: "GET,POST,PUT,DELETE,OPTIONS", // ✅ Allow these HTTP methods
  allowedHeaders: "Content-Type,Authorization" // ✅ Allow headers
}));

// ✅ Handle preflight requests properly
app.options("*", cors());
// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ SIGNUP ROUTE
app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body; // ✅ Accept password

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // ✅ Store password as plain text (not secure)
    const newUser = new User({ username, email, password });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { username, email },
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ LOGIN ROUTE
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && user.password === password) { // ✅ Direct password comparison
      res.status(200).json({
        success: true,
        message: "Login successful",
        user: { username: user.username, email: user.email, isAdmin: user.isAdmin },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ FETCH ALL USERS
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Exclude passwords
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// ✅ DELETE USER BY ID
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

// ✅ START SERVER
const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
