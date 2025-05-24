const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    points: { type: Number, required: true },
    progress: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
