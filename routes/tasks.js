const express = require("express");
const router = express.Router();
const Task = require("../models/Task"); 

// GET /api/tasks - Get all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

module.exports = router;
