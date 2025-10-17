const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  fullname: {
    type: String,
    minLength: 2,
    trim: true,
  },
  username: String,
  email: String,
  password: {
    type: String,
    trim: true,
  },
  gender: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bio: {
    type: String,
    default: "",
  },
  profilepic: {
    type: String,
    default: "male-placeholder.png",
  },
  likedposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  savedposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

module.exports = mongoose.model("user", userSchema);
