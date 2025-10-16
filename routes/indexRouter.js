const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middleware/isLoggedIn");


router.get("/", function (req, res){
    res.render("index");
});



module.exports = router;