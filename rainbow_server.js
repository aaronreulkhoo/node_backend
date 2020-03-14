const express = require('express');
const bodyParser=require('body-parser');
const mongoose = require('mongoose');
const db = require('./db');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const Agent = require('./models/agent');
const Queue = require('./models/queue');
const router = require('./routes/api');

const PORT = process.env.PORT || 3000;

// setting up express
async function createServer() {
    const app = express();

    const httpServer = http.Server(app);
    const io = socketIo(httpServer);

    try {
        await db.connect({io})
    } catch (error) {
        console.error('Unable to connect to Atlas Cluster', error);
        process.exit(1);
    }

    app.use(cors());
    app.use(express.static('public')); // serve simple html
    app.use(bodyParser.json()); //middleware
    app.use('/api', require('./routes/api')); // route setup
    app.use(function(err, req, res, next) { //error handling
        console.log(err.message);
        res.status(422).send({error: err.message})
    });

// api
    httpServer.listen(PORT, () => {
        console.log(`Server listening to Port ${PORT}...`);
    });
    // app.listen(PORT, () => {
    //     console.log(`Listening on port ${PORT}...`);
    // });
}
createServer();


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
    }, 
    servicesToStart: {
        "bubbles":  {
            "start_up":true,
        }, //need services : 
        "telephony":  {
            "start_up":true,
        }, //need services : _contacts, _bubbles, _profiles
        "channels":  {
            "start_up":true,
        }, //need services :  
        "admin":  {
            "start_up":true,
        }, //need services :  
        "fileServer":  {
            "start_up":true,
        }, //need services : _fileStorage
        "fileStorage":  {
            "start_up":true,
        }, //need services : _fileServer, _conversations
        "calllog":  {
            "start_up":true,
        }, //need services :  _contacts, _profiles, _telephony
        "favorites":  {
            "start_up":true,
        } //need services :  
    }
 };

// // Instantiate the SDK
let rainbowSDK = new RainbowSDK(options);
rainbowSDK.start();
var guestToken;
let guestFirstname = "James";
let guestLastname = "Dupont";
let language = "en-US";
let ttl = 86400 // active for a day
router.get("/agentss", async(req,res,next) => {
    try {
        console.log('GET received');
        if (!req.query.category) {
            throw new Error('GET Request Needs Category Number Field');
        }
    } catch (e) {
        console.log(e.message);
    }
    rainbowSDK.admin.createGuestUser(guestFirstname, guestLastname, language, ttl).then((guest) => {
        Agent.findOne({available: true, category: req.query.category},function(err,agent){
            rainbowSDK.admin.askTokenOnBehalf(guest.loginEmail, guest.password).then((token)=>{
                guestToken = token.token;
                if(!agent) {
                    Queue.create({category:req.query.category, token:token.token}).then(function(queue){
                        res.send("You've been put in queue!");
                }).catch(next);
                } else {
                    res.send({agent:agent, token:token.token});
            //update agent field
            //Agent.findByIdAndUpdate({_id:agent._id}, {available:false}).then(function(updated){
            //    res.send(updated);
            //});
                    }
            });
        }).catch(next);
    });
});

router.patch("/agentss/:id", async (req,res) => { // sync must catch errors
    console.log('PATCH received');
    Agent.findOneAndUpdate({available:false, category:req.query.category}, {$set: {'available':true}}).then(function(agent){
        if(!agent){
            res.send("Not find!");
        }else{
            Queue.findOne({category:req.query.category}).sort({created_at: 1}).exec(function(err, guestInQueue){
                if(!guestInQueue){
                    res.send("No guest in queue!");
                }else{
                    res.send(guestInQueue.token);
                    Queue.findByIdAndRemove(guestInQueue._id, function(err, suc){
                        console.log("Successfully Removed!");
                    });
                }    
            });  
        }
    });
});

module.exports(rainbowSDK);
