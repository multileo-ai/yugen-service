const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const { router: authRoutes, authenticate } = require("./routes/auth");
const { router: userRoutes } = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const chatRoutes = require("./routes/chat");

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: ["https://yugen-rose.vercel.app", "http://localhost:3000"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  "https://yugen-rose.vercel.app",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Socket.IO setup
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Register user by their ID
  socket.on("register-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected via socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log("Client disconnected:", socket.id);
  });
});

// Attach io to requests
app.use((req, res, next) => {
  req.io = io;
  req.onlineUsers = onlineUsers;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);

// MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server with Socket.IO started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
