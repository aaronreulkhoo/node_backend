const express = require('express');
const bodyParser=require('body-parser');
const mongoose = require('mongoose');
const router = require('./routes/api');
const Agent = require('./models/agent');

// setting up express
const app = express();
const uri = "mongodb+srv://zilin_wang:200041238@cluster0-zcgfy.gcp.mongodb.net/test?retryWrites=true&w=majority";
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
let RainbowSDK = require("rainbow-node-sdk");

// // Define your configuration
let options = {
     rainbow: {
         host: "sandbox"
     },
     credentials: {
         login: "aaronkhoo@live.com", // To replace by your developer credendials
         password: "6]<epFf$Er'0" // To replace by your developer credentials
     },
     // Application identifier
     application: {
         appID: "a58cfac05b0711eabf7e77d14e87b936",
         appSecret: "JnjQaOpCW9Pc3u2IUQAvyjyiAEINpBo47Vb5S3jSUxHdgQkc3pqFFXGHJPojXbGu"
     },
     // Logs options
     logs: {
         enableConsoleLogs: true,
         enableFileLogs: false,
         "color": true,
         "level": 'debug',
         "customLabel": "acorn-backend",
         "system-dev": {
             "internals": false,
             "http": false,
         },
         file: {
             path: "/var/tmp/rainbowsdk/",
             customFileName: "R-SDK-Node-Sample2",
             level: "debug",
             zippedArchive : false/*,
             maxSize : '10m',
             maxFiles : 10 // */
         }
     },
     // IM options
     im: {
         sendReadReceipt: true
     }
 };

// // Instantiate the SDK
let rainbowSDK = new RainbowSDK(options);
rainbowSDK.start();

rainbowSDK.events.on("rainbow_onready", () => {
    let guestFirstname = "Jean";
    let guestLastname = "Dupont";
    let language = "en-US";
    let ttl = 86400 // active for a day

    rainbowSDK.admin.createGuestUser(guestFirstname, guestLastname, language, ttl).then((guest) => {
    // Do something when the guest has been created and added to that company
        router.get("/agentss", async(req,res,next) => {
            try {
                console.log('GET received');
                if (!req.query.category) {
                    throw new Error('GET Request Needs Category Number Field');
                }
            } catch (e) {
                console.log(e.message);
            }
    
            Agent.findOne({available: true, category: req.query.category},function(err,agent){
                if(!agent) {
                    Queue.create(req.query).then(function(queue){
                        res.send("You've been put in queue!");
                    }).catch(next);
                } else {
                    res.send(agent);
                    //update agent field
                    //Agent.findByIdAndUpdate({_id:agent._id}, {available:false}).then(function(updated){
                    //    res.send(updated);
                    //});
                }
            }).catch(next);
    });
    
    
}).catch((err) => {
    // Do something in case of error
});
});
// let con  = [];
// var bub;
// rainbowSDK.events.on("rainbow_onready", () => {
    
//     let utc = new Date().toJSON().replace(/-/g, '/');
//     rainbowSDK.bubbles.createBubble("TestInviteByEmails" + utc, "TestInviteByEmails" + utc).then((bubble) => {
//         let contacts = [];
//         contacts.push("zilin_wang@mymail.sutd.edu.sg");
//         con = contacts;
//         let invitedAsModerator = false;     // To set to true if you want to invite someone as a moderator
//         let sendAnInvite = false;            // To set to false if you want to add someone to a bubble without having to invite him first
//         let inviteReason = "bot-invite";    // Define a reason for the invite (part of the invite received by the recipient)
//         rainbowSDK.bubbles.inviteContactsByEmailsToBubble(contacts, bubble, invitedAsModerator, sendAnInvite, inviteReason).then(async(bubble) => {
//             console.log("Added in!")
//         });
//     });
// });

// rainbowSDK.events.on("rainbow_onstopped", () => {
//     let id = '5e5f95fb241f882a1d01b3cf';
//     rainbowSDK.bubbles.getBubbleById(id).then(function(bubble) {
//         // do something with the bubble
//         rainbowSDK.bubbles.deleteBubble(bubble).then(function() {
//             // do something once the bubble has been deleted
//             console.log("Deleted!")
//         }).catch(function(err) {
//             // do something if you can't delete the bubble
            
//         });
//     }).catch(function(err) {
//         // do something if something went wrong by getting the bubble
//         throw err;
//     })
    
// });