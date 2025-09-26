import express from "express";
import Message from "../models/Message.js";

const router = express.Router();

// Save text message
router.post("/text", async (req, res) => {
  try {
    const msg = new Message({ type: "text", content: req.body.content });
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all messages (reverse order)
router.get("/", async (req, res) => {
  try {
    const msgs = await Message.find().sort({ createdAt: -1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
