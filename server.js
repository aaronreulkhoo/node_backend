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

/*-----------------------Rainbow API SDK*/
// Load the SDK
// let RainbowSDK = require("rainbow-node-sdk");
//
// // Define your configuration
// let options = {
//     rainbow: {
//         host: "sandbox"
//     },
//     credentials: {
//         login: "aaronkhoo@live.com", // To replace by your developer credendials
//         password: "6]<epFf$Er'0" // To replace by your developer credentials
//     },
//     // Application identifier
//     application: {
//         appID: "a58cfac05b0711eabf7e77d14e87b936",
//         appSecret: "JnjQaOpCW9Pc3u2IUQAvyjyiAEINpBo47Vb5S3jSUxHdgQkc3pqFFXGHJPojXbGu"
//     },
//     // Logs options
//     logs: {
//         enableConsoleLogs: true,
//         enableFileLogs: false,
//         "color": true,
//         "level": 'debug',
//         "customLabel": "acorn-backend",
//         "system-dev": {
//             "internals": false,
//             "http": false,
//         },
//         file: {
//             path: "/var/tmp/rainbowsdk/",
//             customFileName: "R-SDK-Node-Sample2",
//             level: "debug",
//             zippedArchive : false/*,
//             maxSize : '10m',
//             maxFiles : 10 // */
//         }
//     },
//     // IM options
//     im: {
//         sendReadReceipt: true
//     }
// };
//
// // Instantiate the SDK
// let rainbowSDK = new RainbowSDK(options);
// rainbowSDK.start();
