const mongoose = require("mongoose");
// const config = require("config");
// const dbgr = require("debug")("development:mongoose");


mongoose.connect(`mongodb://127.0.0.1:27017/shareframe`)
.then(function(){
    console.log("connected");
})
.catch( function(err){
    console.log("error = " + err);
})

module.exports = mongoose.connection;
