const express = require("express");
const router = express.Router();
const ChatMessage = require("../models/Chat");

const { authenticate } = require("./auth"); // import your JWT middleware
const User = require("../models/User");

// POST /api/chat — send message
router.post("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("name username");
    if (!user) return res.status(404).json({ error: "User not found" });

    const { message } = req.body;

    const newMsg = new ChatMessage({
      userId: user._id,
      name: user.name,
      username: user.username,
      message,
      createdAt: new Date(),
    });

    await newMsg.save();

    res.status(201).json(newMsg);
  } catch (err) {
    console.error("Failed to save chat message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Failed to fetch chat messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
