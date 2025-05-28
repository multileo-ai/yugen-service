const express = require("express");
const router = express.Router();
const ChatbotSession = require("../models/ChatbotSession");

// Create a new chatbot session
router.post("/", async (req, res) => {
  const { userId, title, usermsg, chat } = req.body;

  if (!userId || !title || !usermsg || !chat) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const newSession = new ChatbotSession({ userId, title, usermsg, chat });
    await newSession.save();
    res.status(201).json(newSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all chatbot sessions for a user
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const sessions = await ChatbotSession.find({ userId }).sort({
      createdAt: -1,
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
