const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../utils/generateToken");
const isLoggedIn = require("../middleware/isLoggedIn");
const upload = require("../config/multer");
const postModel = require("../models/postModel");
// to register a user
router.post("/register", async function (req, res) {
  let { fullname, username, email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (user) {
    req.flash("message", "This email is already registered.");
    return res.redirect("/");
  }
  user = await userModel.findOne({ username });
  if (user) {
    req.flash("message", "This username is not available.");
    return res.redirect("/");
  }

  if (password.length < 8) {
    req.flash("message", "Password must be at least 8 characters long.");
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
  req.flash("message", "Registration successful. Welcome aboard!");
  res.redirect("/posts/homepage");
});
// to login in
router.post("/login", async function (req, res) {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) {
    req.flash("message", "No account found with this email address.");
    return res.redirect("/");
  }
  let isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash("message", "Invalid email or password. Please try again.");
    return res.redirect("/");
  }
  let token = generateToken(user);
  res.cookie("token", token);
  req.flash("message", "You have successfully logged in.");
  res.redirect("/posts/homepage");
});

router.get("/logout", function (req, res) {
  res.cookie("token", "");
  req.flash("message", "You have been logged out successfully.");
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
  req.flash("message", "Your profile picture has been removed.");
  res.redirect(`/user/myprofile`);
});

router.post("/changeprofilepic", upload.single("profileImage"), isLoggedIn, async function (req, res) {
  if (!req.file) {
    req.flash("message", "Please select an image to upload.");
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
  req.flash("message", "Your profile picture has been updated.");
  res.redirect(`/user/myprofile`);
});

router.post("/changepassword", isLoggedIn, async function (req, res) {
  let { currentPassword, newPassword } = req.body;

  if (currentPassword === newPassword){
    req.flash("message", "New password must be different from your current password.");
    res.redirect("/user/myprofile");
  }

  let user = await userModel.findOne({ _id: req.user._id });

  let isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    req.flash("message", "Current password is incorrect.");
    return res.redirect(`/user/myprofile`);
  }

  if (newPassword.length < 8) {
    req.flash("message", "New password must be at least 8 characters long.");
    return res.redirect("/user/myprofile");
  }

  let salt = await bcrypt.genSalt(10);
  let hash = await bcrypt.hash(newPassword, salt);
  await userModel.findOneAndUpdate(
    { _id: req.user._id },
    { password: hash },
    { new: true }
  );
  req.flash("message", "Your password has been changed successfully.");
  res.redirect("/posts/homepage");
});

router.post("/updateprofile", isLoggedIn, async function (req, res) {
  let { fullname, username, bio, gender } = req.body;
  let user = await userModel.findOne({ email: req.user.email });

  if (!fullname || fullname.trim() === "") fullname = user.fullname;
  if (bio || bio.trim() !== "")
    bio = bio.trim();
  else
    bio = user.bio || "";
  

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
        req.flash("message", "This username is already in use.");
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
  req.flash("message", "Your profile has been updated successfully.");
  return res.redirect("/user/myprofile");
});

router.post("/deleteuser", isLoggedIn, async function (req, res) {
  let { email, password } = req.body;

  if (email !== req.user.email) {
    req.flash("message", "The provided email does not match your account.");
    return res.redirect("/user/myprofile");
  }
  let user = await userModel.findOne({ email });
  if (!user) {
    req.flash("message", "User account not found.");
    return res.redirect("/user/myprofile");
  }
  let isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash("message", "Incorrect password. Please try again.");
    return res.redirect("/user/myprofile");
  }
  await userModel.deleteOne({ _id: user._id });
  let posts = await postModel.deleteMany({ userid: user._id });
  req.flash("message", "Your account has been permanently deleted.");
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
