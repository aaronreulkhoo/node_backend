const mongoose = require('mongoose');

// setting up mongo
 //const uri = "mongodb+srv://zilin_wang:200041238@cluster0-zcgfy.gcp.mongodb.net/newdatastore?retryWrites=true&w=majority";
const uri = "mongodb+srv://aaron:aaron@esc-mongo-4dgm3.mongodb.net/test?retryWrites=true&w=majority";
async function connect(){
    mongoose.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
    console.log("Connected to Atlas Cluster!")
}

exports.connect = connect;
