const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const User = require("../models/User");
const ChatMessage = require("../models/Chat"); // Add your Chat model

// Use multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 }, // 500KB max
});

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader)
    return res.status(401).json({ error: "No token, authorization denied" });

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader;

  try {
    const decoded = jwt.verify(token, "your_jwt_secret");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

// ===== Auth Routes =====

// Signup
router.post("/signup", async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
    const existingEmail = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });

    if (existingEmail)
      return res.status(400).json({ error: "Email already in use" });
    if (existingUsername)
      return res.status(400).json({ error: "Username already taken" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, username, email, password: hashed });
    await user.save();

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    res.status(500).json({ error: "Server error during signup" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, "your_jwt_secret", {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ===== Profile Update with Multer =====
router.put(
  "/update",
  authenticate,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, username, phone, dob, bio, skills } = req.body;
      const userId = req.user.id;

      if (username) {
        const existingUser = await User.findOne({
          username,
          _id: { $ne: userId },
        });
        if (existingUser)
          return res.status(400).json({ message: "Username already taken" });
      }

      const updates = {
        name,
        username,
        phone,
        dob,
        bio,
        skills: skills ? JSON.parse(skills) : [],
      };

      if (req.files?.profileImage) {
        updates.profileImage = {
          data: req.files.profileImage[0].buffer,
          contentType: req.files.profileImage[0].mimetype,
        };
      }

      if (req.files?.bannerImage) {
        updates.bannerImage = {
          data: req.files.bannerImage[0].buffer,
          contentType: req.files.bannerImage[0].mimetype,
        };
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updates, {
        new: true,
      });

      if (!updatedUser)
        return res.status(404).json({ message: "User not found" });

      res.json(updatedUser);
    } catch (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ message: "Images must be smaller than 500KB" });
      }
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ===== User Info =====
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/user/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "-password"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/image/:userId/:type", async (req, res) => {
  const { userId, type } = req.params;
  const user = await User.findById(userId);

  if (!user || !["profileImage", "bannerImage"].includes(type)) {
    return res.status(404).send("Not found");
  }

  const image = user[type];
  if (image && image.data) {
    res.contentType(image.contentType);
    res.send(image.data);
  } else {
    res.status(404).send("Image not found");
  }
});

// ===== AI Chat History =====
router.post("/aichat", async (req, res) => {
  const { userId, chatSession } = req.body;

  if (!userId || !chatSession) {
    return res.status(400).json({ message: "Missing userId or chatSession" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.aichat.push({
      title: chatSession.title,
      usermsg: chatSession.usermsg,
      chat: chatSession.chat,
    });

    await user.save();

    res.status(200).json({ message: "Chat saved successfully" });
  } catch (error) {
    console.error("Error saving chat:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/aichat/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("aichat");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.aichat);
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===== Community Chat =====
router.post("/chat", authenticate, async (req, res) => {
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

router.get("/chat", async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Failed to fetch chat messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = {
  router,
  authenticate,
};
