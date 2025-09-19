import express from "express";
import Feedback from "../models/Feedback.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import Activity from "../models/Activity.js";

const router = express.Router();

/**
 * Submit feedback (user side)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { type, subject, message, rating, restaurant, order, priority } = req.body;

    if (!type || !subject || !message) {
      return res.status(400).json({ message: "Type, subject, and message are required" });
    }

    const feedback = new Feedback({
      user: req.user.userId,
      restaurant: restaurant || null,
      order: order || null,
      type,
      subject,
      message,
      rating: rating || null,
      priority: priority || "medium",
    });

    await feedback.save();

    // Log feedback submission activity
    await Activity.create({
      user: req.user.userId,
      action: "submitted feedback",
      details: { feedbackId: feedback._id, subject, type },
    });

    await feedback.populate("user", "name email");
    await feedback.populate("restaurant", "name");
    await feedback.populate("order");

    res.status(201).json({ message: "Feedback submitted successfully", feedback });
  } catch (error) {
    console.error("Feedback submission error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Get logged-in user's feedback
 */
router.get("/my-feedback", authMiddleware, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user.userId })
      .populate("restaurant", "name")
      .populate("order")
      .populate("adminResponse.respondedBy", "name")
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error("Get my feedback error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Admin: Get all feedback
 */
router.get("/admin", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const feedbacks = await Feedback.find(query)
      .populate("user", "name email")
      .populate("restaurant", "name")
      .populate("order")
      .populate("adminResponse.respondedBy", "name")
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error("Get all feedback error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single feedback by ID (for admin detail view)
router.get("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate("user", "name email")
      .populate("restaurant", "name")
      .populate("order")
      .populate("adminResponse.respondedBy", "name");

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json(feedback);
  } catch (error) {
    console.error("Get feedback by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


/**
 * Admin: Respond to feedback
 *
 * IMPORTANT: this now includes newStatus in the Activity details so the dashboard
 * can display a status badge for "respond" activities when admin set a status while responding.
 */
router.put("/:id/respond", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { message, status } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    // update admin response and status (if provided)
    feedback.adminResponse = {
      message,
      respondedBy: req.user.userId,
      respondedAt: new Date(),
    };
    // set status if passed in, otherwise keep existing or default to "in-progress"
    feedback.status = status || feedback.status || "in-progress";

    await feedback.save();

    // Log admin response activity — include subject/type so dashboard shows properly
    await Activity.create({
      user: req.user.userId,
      action: "responded to feedback",
      details: {
        feedbackId: feedback._id,
        subject: feedback.subject,   // ✅ added
        type: feedback.type,         // ✅ added
        newStatus: feedback.status,  // ✅ ensure status badge
      },
    });

    res.json({ message: "Response added successfully" });
  } catch (error) {
    console.error("Respond to feedback error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Admin: Update feedback status/priority
 */
router.put("/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, priority } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    if (status) feedback.status = status;
    if (priority) feedback.priority = priority;

    await feedback.save();

    // Log feedback status update — include subject/type so dashboard never shows empty
    await Activity.create({
      user: req.user.userId,
      action: "updated feedback status",
      details: {
        feedbackId: feedback._id,
        subject: feedback.subject,   // ✅ added
        type: feedback.type,         // ✅ added
        newStatus: status || feedback.status,
        newPriority: priority || feedback.priority,
      },
    });

    res.json({ message: "Feedback updated successfully" });
  } catch (error) {
    console.error("Update feedback status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
