import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  type: { type: String, enum: ["text", "file"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Message", messageSchema);
