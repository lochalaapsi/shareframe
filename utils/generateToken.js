const jwt = require("jsonwebtoken");

const token = (user)=>{
    return jwt.sign({email: user.email, _id: user._id}, "ppp")
}
module.exports.generateToken = token;

