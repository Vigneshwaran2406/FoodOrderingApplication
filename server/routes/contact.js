import express from "express";
import ContactMessage from "../models/ContactMessage.js";
import { authMiddleware, verifyAdmin } from "../middleware/auth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

// Get logged-in user's own messages
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const messages = await ContactMessage.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error("Error fetching user messages:", err);
    res.status(500).json({ success: false, message: "Failed to fetch your messages" });
  }
});

// POST contact (guest or user)
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message, userId } = req.body;

    const newMessage = new ContactMessage({
      user: userId || null,
      name,
      email,
      subject,
      message,
    });

    await newMessage.save();
    res.json({ success: true, msg: "Message sent successfully" });
  } catch (err) {
    console.error("Error saving contact message:", err);
    res.status(500).json({ success: false, msg: "Failed to send message" });
  }
});

// GET all messages (admin only)
router.get("/admin", authMiddleware, verifyAdmin, async (req, res) => {
  try {
    const messages = await ContactMessage.find().populate("user", "name email");
    res.json(messages);
  } catch (err) {
    console.error("Error fetching all messages:", err);
    res.status(500).json({ success: false, msg: "Failed to fetch messages" });
  }
});

// Admin reply to a contact message
router.put("/admin/respond/:id", authMiddleware, verifyAdmin, async (req, res) => {
  try {
    const { response } = req.body;
    const message = await ContactMessage.findById(req.params.id).populate("user", "email name");

    if (!message) {
      return res.status(404).json({ success: false, msg: "Message not found" });
    }
    
    // ⭐ Check the correct response field from the model
    if (message.response?.text) {
      return res.status(400).json({ success: false, msg: "This message has already been responded to." });
    }

    // ⭐ Save the response and timestamp to the `response` object
    message.response = {
        text: response,
        respondedAt: new Date(),
    };
    
    // ⭐ Update the status to 'responded'
    message.status = "responded";
    
    await message.save();

    // Send email to guest or user without an active status
    if (!message.user || message.user?.status === "inactive") {
      await sendEmail({
        to: message.email,
        subject: `Re: ${message.subject}`,
        text: response,
        html: `<p>${response}</p>`,
      });
    }

    res.json({ success: true, msg: "Reply sent successfully", message });
  } catch (err) {
    console.error("Error replying to contact message:", err);
    res.status(500).json({ success: false, msg: "Failed to send reply" });
  }
});

export default router;
