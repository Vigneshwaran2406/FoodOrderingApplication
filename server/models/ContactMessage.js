import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // null for guests
  },
  email: {
    type: String,
    required: true, // guests + users both
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["open", "responded", "closed"],
    default: "open",
  },
  response: {
    text: String,
    respondedAt: Date,
  },
  deliveredTo: {
    type: String,
    enum: ["in-app", "email", "both"],
    default: "in-app",
  },
}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);
