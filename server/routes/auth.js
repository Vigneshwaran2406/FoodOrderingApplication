// server/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// ✅ Helper: generate JWT + set httpOnly cookie
const sendTokenResponse = (user, res) => {
  try {
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // session-only, 1 hour
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development", // HTTPS in prod
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("JWT sign error:", err);
    res.status(500).json({ message: "Token generation failed" });
  }
};

// ✅ Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      address,
      role: "user",
    });

    await user.save();

    sendTokenResponse(user, res);
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
  return res.status(403).json({ message: "Your account has been deactivated. Please contact support." });
}
user.lastLogin = new Date();
await user.save();


    sendTokenResponse(user, res);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Logout
// ✅ Logout
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    // 🔹 Track last logout
    await User.findByIdAndUpdate(req.user.userId, {
      lastLogout: new Date(),
    });

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "development",
      sameSite: "strict",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ✅ Get current user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Fetch current user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
