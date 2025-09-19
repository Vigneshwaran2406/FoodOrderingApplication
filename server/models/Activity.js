import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed }, // 👈 this allows restaurant/order/etc.
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Activity", activitySchema);
