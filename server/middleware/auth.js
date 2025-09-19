// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // ✅ Only read token from cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("JWT verify error:", err.message);

      // 🚀 Clear cookie if invalid/expired (e.g. server restarted)
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      return res.status(401).json({ message: "Session expired, please login again" });
    }

    req.user = decoded;

    // ✅ Ensure user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
      return res.status(401).json({ message: "User not found or inactive" });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    // 🚀 Always clear cookie on unexpected error
    if (req.cookies?.token) {
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return res.status(401).json({ message: "Session expired, please login again" });
  }
};

// ✅ Token verification (used in most routes)
export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token || req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Admin check
export const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};