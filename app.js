const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const indexRouter = require("./routes/indexRouter");
const userRouter = require("./routes/userRouter");
const postRouter = require("./routes/postRouter");
const db = require("./config/mongoose-connect");
const session = require("express-session");
const flash = require("connect-flash");

// Session middleware
app.use(session({
  secret: "secretKey",
  resave: false,
  saveUninitialized: false,
}));

// Flash middleware
app.use(flash());


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  res.locals.message = req.flash("message");

  next();
});
app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/posts", postRouter);





app.listen(3000);