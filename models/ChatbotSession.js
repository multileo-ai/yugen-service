const mongoose = require("mongoose");

const todoItemSchema = new mongoose.Schema({
  title: String,
});

const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  usermsg: String,
  chat: [todoItemSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatbotSession", chatSessionSchema);
