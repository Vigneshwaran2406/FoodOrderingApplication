import express from "express";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Activity from "../models/Activity.js";
import Product from "../models/Product.js";
import { authMiddleware } from "../middleware/auth.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// 📂 Storage config (save in /uploads folder)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure /uploads exists in backend root
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  }
});

const upload = multer({ storage });

// 📌 Upload Profile Image
router.put("/profile/upload", authMiddleware, upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.userId; // ✅ authMiddleware sets req.user

    // 👉 Build full URL dynamically
    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${backendUrl}/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Log activity
    await Activity.create({
      user: userId,
      action: "profile updated",
      details: { fields: ["Profile Image"] }
    });

    res.json({ profileImage: imageUrl, message: "Profile image updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Failed to upload profile image" });
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    Get logged-in user's profile
 */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const userBefore = await User.findById(req.user.userId);
    if (!userBefore) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};
    const changedFields = [];

    if (name !== undefined && name !== userBefore.name) {
      updateData.name = name;
      changedFields.push("Name");
    }
    if (phone !== undefined && phone !== userBefore.phone) {
      updateData.phone = phone;
      changedFields.push("Phone");
    }

    if (address) {
      if (address.street !== undefined && address.street !== userBefore.address.street) {
        updateData["address.street"] = address.street;
        changedFields.push("Street");
      }
      if (address.city !== undefined && address.city !== userBefore.address.city) {
        updateData["address.city"] = address.city;
        changedFields.push("City");
      }
      if (address.state !== undefined && address.state !== userBefore.address.state) {
        updateData["address.state"] = address.state;
        changedFields.push("State");
      }
      if (address.zipCode !== undefined && address.zipCode !== userBefore.address.zipCode) {
        updateData["address.zipCode"] = address.zipCode;
        changedFields.push("Zip Code");
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (changedFields.length > 0) {
      await Activity.create({
        user: req.user.userId,
        action: "profile updated",
        details: { fields: changedFields }
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


/**
 * @route   PUT /api/users/profile/change-password
 * @desc    Change password (uses pre-save hook for hashing)
 */
router.put("/profile/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both current and new password are required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect" });
    }

    // Assign plain new password, pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    // ✅ Log activity
    await Activity.create({
      user: req.user.userId,
      action: "profile updated",
      details: { fields: ["Password"] }
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   POST /api/users/favorites/:productId
 * @desc    Add product to favorites
 */
router.post("/favorites/:productId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user.favorites.includes(req.params.productId)) {
      user.favorites.push(req.params.productId);
      await user.save();

      // ✅ Fetch product details directly
      const favProduct = await Product.findById(req.params.productId);

      await Activity.create({
        user: req.user.userId,
        action: "added favourite",
        details: {
          name: favProduct?.name || "Unknown",
          price: favProduct?.price || 0,
          rating: favProduct?.averageRating || "New"
        }
      });
    }
    res.json({ message: "Added to favorites" });
  } catch (error) {
    console.error("Favorites add error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   DELETE /api/users/favorites/:productId
 * @desc    Remove product from favorites
 */
router.delete("/favorites/:productId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.favorites = user.favorites.filter(
      (id) => id.toString() !== req.params.productId
    );
    await user.save();

    res.json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Favorites remove error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/users/favorites
 * @desc    Get user's favorite products (populated)
 */
router.get("/favorites", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate("favorites");
    res.json(user.favorites || []);
  } catch (error) {
    console.error("Favorites fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   POST /api/users/:id/review
 * @desc    Add review for delivered order (full order review only)
 */
router.post("/:id/review", authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findById(req.params.id).populate("items.product");

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== req.user.userId)
      return res.status(403).json({ message: "Not your order" });
    if (order.orderStatus !== "delivered")
      return res.status(400).json({ message: "You can only review delivered orders" });

    order.orderReview = {
      rating,
      comment,
      createdAt: new Date()
    };

    await order.save();

    // ✅ Log activity
    await Activity.create({
      user: req.user.userId,
      action: "reviewed an order",
      details: {
        orderId: order._id,
        rating,
        comment
      }
    });

    res.status(201).json({ message: "Order review added successfully", review: order.orderReview });
  } catch (error) {
    console.error("Order review error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get recent activities of logged-in user
router.get("/my-activities", authMiddleware, async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
