const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  bio: { type: String, default: "" },
  phone: { type: String, default: "" },
  dob: { type: Date, default: null },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  skills: { type: [String], default: [] },
  profileImage: { type: String, default: "" },
  bannerImage: { type: String, default: "" },
});

module.exports = mongoose.model("User", UserSchema);
