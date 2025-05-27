const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { router: authRoutes, authenticate } = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const chatRoutes = require("./routes/chat");

const app = express();

// Middleware
app.use(
  cors({
    origin: ["https://yugen-service.onrender.com"],
    credentials: true,
  })
);
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve images

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.use("/api/chat", chatRoutes);

// MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    app.listen(5000, () => console.log("Server started on port 5000"))
  )
  .catch((err) => console.log(err));
