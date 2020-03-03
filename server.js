const express = require('express');
const bodyParser=require('body-parser');
const mongoose = require('mongoose');

// setting up express
const app = express();
const uri = "mongodb+srv://aaron:aaron@esc-mongo-4dgm3.mongodb.net/test?retryWrites=true&w=majority"
mongoose.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.static('public')); // serve simple html
app.use(bodyParser.json()); //middleware
app.use('/api', require('./routes/api')); // route setup
app.use(function(err,req,res,next){ //error handling
    console.log(err.message);
    res.status(422).send({error: err.message})
});

// api
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});
