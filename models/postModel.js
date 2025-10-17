const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  fullname: String,
  username: String,
  image: {
    type: String,
    minLength: 2,
    trim: true,
  },
  title: String,
  caption: String,
  time: {
    type: String,
  },
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  userprofilepic: String,
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  comments: {
    type: Array,
    default: [],
  },
  saved: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
});

module.exports = mongoose.model("post", postSchema);
