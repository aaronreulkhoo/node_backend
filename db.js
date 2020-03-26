const mongoose = require('mongoose');

// setting up mongo
const uri = "mongodb+srv://zilin_wang:200041238@cluster0-zcgfy.gcp.mongodb.net/test?retryWrites=true&w=majority";
async function connect(){
    mongoose.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
    console.log("Connected to Atlas Cluster!")
}

exports.connect = connect;
