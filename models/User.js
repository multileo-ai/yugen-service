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
  profileImage: {
    type: String,
    default:
      "https://img.freepik.com/premium-vector/social-media-logo_1305298-29989.jpg?semt=ais_hybrid&w=740",
  },
  bannerImage: {
    type: String,
    default:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbpy2tMwk5uP2_cyuU4TTb-780DKGCx4Wp4g&s",
  },
});

module.exports = mongoose.model("User", UserSchema);
