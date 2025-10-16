const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../utils/generateToken");
const isLoggedIn = require("../middleware/isLoggedIn");
const upload = require("../config/multer");
const postModel = require("../models/postModel");

router.post("/register", async function (req, res) {
  let { fullname, username, email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (user) {
    req.flash("message", "Email Already Exists");
    return res.redirect("/");
  }
  user = await userModel.findOne({ username });
  if (user) {
    req.flash("message", "username not available");
    return res.redirect("/");
  }

  if (password.length < 8) {
    req.flash("message", "Password must be 8 character long");
    return res.redirect("/");
  }

  let salt = await bcrypt.genSalt(10);
  let hash = await bcrypt.hash(password, salt);
  username = username.trim();
  user = await userModel.create({
    fullname,
    username,
    email,
    password: hash,
  });

  let token = generateToken(user);
  res.cookie("token", token);
  req.flash("message", "Registration Complete");
  res.redirect("/posts/homepage");
});

router.post("/login", async function (req, res) {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) {
    req.flash("message", "Email address not registered");
    return res.redirect("/");
  }
  let isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash("message", "Incorrect password or email");
    return res.redirect("/");
  }
  let token = generateToken(user);
  res.cookie("token", token);
  req.flash("message", "Successfully Loggedin");
  res.redirect("/posts/homepage");
});

router.get("/logout", function (req, res) {
  res.cookie("token", "");
  req.flash("message", "Logged Out");
  res.redirect("/");
});

router.get("/myprofile", isLoggedIn, function (req, res) {
  res.render("myprofile", { user: req.user });
});

router.get("/myposts", isLoggedIn, async function (req, res) {
  let user = await userModel.findOne({ email: req.user.email });
  let posts = await postModel.find({ userid: user._id });
  res.render("myposts", { user, posts });
});

router.get("/profile/:id", isLoggedIn, async function (req, res) {
  let post = await postModel.findOne({ _id: req.params.id });
  let user = await userModel.findOne({ _id: post.userid });

  if (String(user._id) === String(req.user._id)) {
    return res.redirect("/user/myprofile");
  }
  let userPosts = await postModel.find({ userid: user._id });
  res.render("profile", { user, userPosts });
});

router.get("/removeprofilepic", isLoggedIn, async function (req, res) {
  let profilepic = "";
  if (!req.user.gender) profilepic = "male-placeholder.png";
  else profilepic = `${req.user.gender}-placeholder.png`;

  let user = await userModel.findOneAndUpdate(
    { _id: req.user._id },
    { profilepic },
    { new: true }
  );
  let posts = await postModel.updateMany(
    { userid: req.user._id },
    { userprofilepic: profilepic },
    { new: true }
  );
  req.flash("message", "Removed profile picture");
  res.redirect(`/user/myprofile`);
});

router.post("/changeprofilepic", upload.single("profileImage"), isLoggedIn, async function (req, res) {
    if (!req.file) {
      req.flash("message", "Choose an image first");
      return res.redirect(`/user/myprofile`);
    }
    let user = await userModel.findOneAndUpdate(
      { _id: req.user._id },
      { profilepic: req.file.filename },
      { new: true }
    );
    let posts = await postModel.updateMany(
      { userid: req.user._id },
      { userprofilepic: req.file.filename },
      { new: true }
    );
    req.flash("message", "Updated profile picture");
    res.redirect(`/user/myprofile`);
  }
);

router.post("/changepassword", isLoggedIn, async function (req, res) {
  let { currentPassword, newPassword } = req.body;

  if (currentPassword === newPassword) {
    req.flash("message", "New password cannot be the same as your current password");
    res.redirect("/user/myprofile");
  }

  let user = await userModel.findOne({ _id: req.user._id });

  let isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    req.flash("message", "Password incorrect");
    return res.redirect(`/user/myprofile`);
  }

  if (newPassword.length < 8) {
    req.flash("message", "New password is too short");
    return res.redirect("/user/myprofile");
  }

  let salt = await bcrypt.genSalt(10);
  let hash = await bcrypt.hash(newPassword, salt);
  await userModel.findOneAndUpdate(
    { _id: req.user._id },
    { password: hash },
    { new: true }
  );
  req.flash("message", "Password has been changed");
  res.redirect("/posts/homepage");
});

router.post("/updateprofile", isLoggedIn, async function (req, res) {
  let { fullname, username, bio, gender } = req.body;
  let user = await userModel.findOne({ email: req.user.email });

  if (!fullname || fullname.trim() === "") fullname = user.fullname;

  if (bio || bio.trim() !== "") bio = bio.trim();
  else {
    bio = user.bio || "";
  }

  let profilepic = user.profilepic;
  if (user.profilepic.includes("placeholder")) {
    profilepic = `${gender}-placeholder.png`;
  }

  let updatedUser = await userModel.findOneAndUpdate(
    { email: req.user.email },
    { fullname, gender, bio, profilepic },
    { new: true }
  );
  let tobeposts = await postModel.updateMany(
    { userid: user._id.toString() },
    { fullname, userprofilepic: profilepic },
    { new: true }
  );

  if (username && username.trim() !== "") {
    if (username.trim() !== user.username) {
      let existingUser = await userModel.findOne({ username });
      if (existingUser) {
        req.flash("message", "Username already taken");
        return res.redirect("/user/myprofile");
      }
      await userModel.findOneAndUpdate(
        { email: req.user.email },
        { username },
        { new: true }
      );
      await postModel.updateMany(
        { userid: user._id.toString() },
        { username },
        { new: true }
      );
    }
  }
  req.flash("message", "Applied changes");
  return res.redirect("/user/myprofile");
});

router.post("/deleteuser", isLoggedIn, async function (req, res) {
  let { email, password } = req.body;

  if (email !== req.user.email) {
    req.flash("message", "Email doesn't match");
    return res.redirect("/user/myprofile");
  }
  let user = await userModel.findOne({ email });
  if (!user) {
    req.flash("message", "User not found");
    return res.redirect("/user/myprofile");
  }
  let isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash("message", "Incorrect password");
    return res.redirect("/user/myprofile");
  }
  await userModel.deleteOne({ _id: user._id });
  let posts = await postModel.deleteMany({ userid: user._id });
  req.flash("message", "Account deleted permanently");
  res.redirect("/");
});

router.get("/likedposts", isLoggedIn, async function (req, res) {
  let posts = await postModel.find({ likes: req.user._id });
  res.render("likedposts", { posts, user: req.user });
});
router.get("/savedposts", isLoggedIn, async function (req, res) {
  let posts = await postModel.find({ saved: req.user._id });
  res.render("savedposts", { posts, user: req.user });
});
module.exports = router;
