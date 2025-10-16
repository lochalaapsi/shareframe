const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

module.exports = async function (req, res, next){
    if(!req.cookies.token)
        return res.status(400).redirect("/");

    try{
        let info = jwt.verify(req.cookies.token, "ppp");
        let user = await userModel.findOne({email: info.email}).select("-password");
        req.user = user;
        next();
    }
    catch(err){
        res.send("caught at isLoggedIn");
    }



    

    


}