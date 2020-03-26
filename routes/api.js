const express = require('express');
const router=express.Router();
const Agent = require('../models/agent');
const Queue = require('../models/queue');
const RainbowSDK = require("rainbow-node-sdk");
// Options Config for rainbow
const options = {
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
        enableConsoleLogs: false,
        enableFileLogs: false,
        "level": 'info',
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
// Rainbow SDK Object
const rainbowSDK = new RainbowSDK(options);


/*-----------------------Rainbow API SDK*/
async function loadRainbow() {
    try {
        await rainbowSDK.start();
        console.log("Connected to Rainbow SDK!")
    } catch (error) {
        console.error('Unable to connect to Rainbow API', error);
        process.exit(1);
    }
}
loadRainbow();

var guestToken;
let guestFirstname = "James";
let guestLastname = "Dupont";
let language = "en-US";
let ttl = 86400; // active for a day

router.get("/agents", async(req,res,next) => {
    try {
        console.log('GET: api/agents');
        if (!req.query.category) {
            throw new Error("GET Request Needs 'Category' Number Parameter");
        }
    } catch (e) {
        return next(e);
    }
    rainbowSDK.admin.createGuestUser(guestFirstname, guestLastname, language, ttl).then((guest) => {
        Agent.findOneAndUpdate({available: true, category: req.query.category},{$set:{'available':false}}, function(err,agent){
            rainbowSDK.admin.askTokenOnBehalf(guest.loginEmail, guest.password).then((token)=>{
                guestToken = token.token;
                if(!agent) {
                    Queue.create({category:req.query.category, token:token.token, agentId:"Null", agentName: "Null"}).then(function(){
                        res.send({agentId:"Null",agentName:"Null", token:token.token});
                    }).catch(next);
                } else {
                    res.send({agentId:agent.rainbowId,agentName:agent.name, token:token.token});
                }
            });
        }).catch(next);
    });
});

router.get("/queue", async(req,res,next) => {
    try {
        console.log('GET: api/queue');
        if (!req.query.token) {
            throw new Error("GET Request Needs 'Token' String Parameter");
        }
    } catch (e) {
        return next(e);
    }
    Queue.findOne({token:req.query.token}).then(function(guestFound) {
        if(!guestFound){
            throw new Error('Invalid Queue Token');
        } else{
            if(guestFound.agentId!=='Null'){ //If agent has been assigned
                Queue.findOneAndDelete({token:req.query.token}).then(function (guestDeleted) {
                    res.send({agentId:guestDeleted.agentId, agentName:guestDeleted.agentName, token:guestDeleted.token});
                }).catch(next)
            }else{
                res.send({agentId:guestFound.agentId, agentName:guestFound.agentName, token:guestFound.token});
                // Agent.findOneAndUpdate({available: true, category: guestFound.category},{$set:{'available':true}}, function(err,agent){
                //     if(!agent) {
                //         console.log("Keep trying!");
                //         res.send({agentId:null,agentName:null, token:guestFound.token});
                //     } else {
                //         console.log("Finally get!");
                //         res.send({agentId:agent.rainbowId,agentName:agent.name, token:guestFound.token});
                //         Queue.findByIdAndRemove({_id:guestFound._id});
                //     }
                // }).catch(next);
            }
        }
    }).catch(next);
});


router.patch("/agents", async (req,res, next) => { // sync must catch errors
    try {
        console.log('PATCH: api/agents');
        if (!req.query.agentId) {
            throw new Error("PATCH Request Needs 'AgentId' Number Parameter");
        }
    } catch (e) {
        return next(e);
    }
    Agent.findOne({rainbowId:req.query.agentId}).then(function(agent){
        if(!agent){
            throw new Error('Invalid Agent ID');
        }else{
            Queue.findOne({category:agent.category, agentId:"Null"}).sort({created_at: 1}).exec(function(err, guestInQueue){
                if(!guestInQueue){
                    Agent.findOneAndUpdate({rainbowId:agent.rainbowId}, {$set:{'available':true}}).then(function(){
                        res.send("Agent has been made available");
                    }).catch(next);
                }else{
                    Queue.findByIdAndUpdate({_id:guestInQueue._id}, {$set:{'agentId':agent.rainbowId, 'agentName':agent.name}}).then(function(){
                        res.send("Agent has been made reassigned");
                    }).catch(next);
                }
            });
        }
    }).catch(next);
});

router.post("/agents", function(req,res,next){
    console.log('POST received');
    Agent.create({name:req.query.name, rainbowId:req.query.rainbowId, available:true, category:req.query.category}).then(function(agent){
        res.send(agent);
    }).catch(next);
});

router.delete("/queue", function(req,res,next){
    Queue.deleteOne({token:req.body.token}).then(function(response){
        if (response.deletedCount) {
            res.send("Queue Number Deleted")
        } else {
            res.send("Queue Number Not Found")
        }

    });
});

module.exports = router;
