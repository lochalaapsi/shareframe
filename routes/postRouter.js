const express = require("express");
const router = express.Router();
const postModel = require("../models/postModel");
const isLoggedIn = require("../middleware/isLoggedIn");
const upload = require("../config/multer");
const userModel = require("../models/userModel");

router.get("/homepage", isLoggedIn, async function (req, res) {
  let posts = await postModel.find();
  res.render("homepage", { posts, user: req.user });
});

router.get("/addpost", isLoggedIn, function (req, res) {
  res.render("addpost", { user: req.user });
});

router.post(
  "/createpost",
  isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    let user = await userModel.findOne({ _id: req.user._id });

    let now = new Date();
    let year = now.getFullYear();
    let month = String(now.getMonth() + 1).padStart(2, "0");
    let day = String(now.getDate()).padStart(2, "0");
    let hours = String(now.getHours()).padStart(2, "0");

    let num = Number(hours);
    let meridian = "AM";
    if (num > 12) {
      hours = String(num % 12);
      meridian = "PM";
    }

    let minutes = String(now.getMinutes()).padStart(2, "0");

    let dateTime = `${hours}:${minutes} ${meridian} ${day}-${month}-${year}`;
    let image = req.file ? req.file.filename : null;
    let createdPost = await postModel.create({
      fullname: user.fullname,
      username: user.username,
      image: image,
      title: req.body.title,
      caption: req.body.caption,
      time: dateTime,
      userid: req.user._id,
      userprofilepic: user.profilepic,
    });
    user.posts.push(createdPost._id);
    await user.save();
    req.flash("message", "Post added");
    res.redirect("/posts/homepage");
  }
);

router.get("/editpost/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOne({ _id: req.params.id });
  res.render("editpost", { post, user: req.user });
});

router.post("/editpost/:id", isLoggedIn, async function (req, res) {
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, "0");
  let day = String(now.getDate()).padStart(2, "0");
  let hours = String(now.getHours()).padStart(2, "0");

  let num = Number(hours);
  let meridian = "AM";
  if (num > 12) {
    hours = String(num % 12);
    meridian = "PM";
  }

  let minutes = String(now.getMinutes()).padStart(2, "0");

  let dateTime = `Edited on ${hours}:${minutes} ${meridian} ${day}-${month}-${year}`;
  let updatedpost = await postModel.findOneAndUpdate(
    { _id: req.params.id },
    { title: req.body.title, caption: req.body.caption, time: dateTime },
    { new: true }
  );
  res.redirect("/posts/homepage");
});

router.get("/like/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOne({ _id: req.params.id });
  if (post.likes.indexOf(req.user._id) === -1) {
    post.likes.push(req.user._id);
  } else {
    post.likes.splice(post.likes.indexOf(req.user._id), 1);
  }

  await post.save();

  res.redirect("/posts/homepage");
});
router.get("/save/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOne({ _id: req.params.id });
  if (post.saved.indexOf(req.user._id) === -1) post.saved.push(req.user._id);
  else post.saved.splice(post.saved.indexOf(req.user._id), 1);

  await post.save();

  res.redirect("/posts/homepage");
});

router.get("/viewpost/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOne({ _id: req.params.id });
  let user = await userModel.findOne({ _id: post.userid });
  res.render("viewpost", { post, user, self: req.user });
});
module.exports = router;
