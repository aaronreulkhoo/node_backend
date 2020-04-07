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

//First GET function
router.get("/agents", async(req,res,next) => {
    try {
        //Check if neccessary inputs are received
        console.log('GET: api/agents');
        if (!req.query.category) {
            throw new Error("GET Request Needs 'Category' Number Parameter");
        }
        if (!req.query.firstName) {
            throw new Error("GET Request Needs 'FirstName' String Parameter");
        }
        if (!req.query.lastName) {
            throw new Error("GET Request Needs 'LastName' String Parameter");
        }
        if(req.query.category>4 || req.query.category<0){
            throw new Error("'Category' Exceeds Threshold Value");
        }
    } catch (e) {
        return next(e);
    }
    //Create Guest With Name
    rainbowSDK.admin.createGuestUser(req.query.firstName, req.query.lastName, language, ttl).then((guest) => {
        //Find any agent available
        Agent.findOneAndUpdate({available: true, category: req.query.category},{$set:{'available':false}}, function(err,agent){
            rainbowSDK.admin.askTokenOnBehalf(guest.loginEmail, guest.password).then((token)=>{
                guestToken = token.token;
                if(!agent) {
                    //No available agent, guest pushed into queue
                    Queue[req.query.category].create({guestFirstName: req.query.firstName, guestLastName: req.query.lastName, token:token.token, agentId:"Null", agentName: "Null"}).then(function(){
                        res.send({guestFirstName: req.query.firstName, guestLastName: req.query.lastName,category: req.query.category, agentId:"Null",agentName:"Null", token:token.token});
                    }).catch(next);
                } else {
                    //Agent available, ready to make connection
                    res.send({guestFirstName: req.query.firstName, guestLastName: req.query.lastName,category: req.query.category, agentId:agent.rainbowId,agentName:agent.name, token:token.token});
                }
            });
        }).catch(next);
    });
});

router.get("/queue", async(req,res,next) => {
    try {
        //Check if neccessary inputs are received
        console.log('GET: api/queue');
        if (!req.query.token) {
            throw new Error("GET Request Needs 'Token' String Parameter");
        }
        if (!req.query.category) {
            throw new Error("Get Request Needs 'Category' Number Parameter");
        }
        if (req.query.category>4 || req.query.category<0) {
            throw new Error("'Category' Exceeds Threshold Value");
         }
    } catch (e) {
        return next(e);
    }
    Queue[req.query.category].findOne({token:req.query.token}).then(function(guestFound) {
        if(!guestFound){
            throw new Error('Invalid Queue Token');
        } else{
            if(guestFound.agentId!=='Null'){ //If agent has been assigned
                Queue[req.query.category].findOneAndDelete({token:req.query.token}).then(function (guestDeleted) {
                    res.send({guestFirstName: req.query.firstName, guestLastName: req.query.lastName,category: req.query.category, agentId:guestDeleted.agentId, agentName:guestDeleted.agentName, token:guestDeleted.token});
                }).catch(next)
            }else{
                res.send({guestFirstName: req.query.firstName, guestLastName: req.query.lastName,category: req.query.category, agentId:guestFound.agentId, agentName:guestFound.agentName, token:guestFound.token});
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
        //Check if neccessary inputs are received
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
            //Find the eariest guest that is not assigned to an agent
            Queue[agent.category].findOne({agentId:"Null"}).sort({created_at: 1}).exec(function(err, guestInQueue){
                if(!guestInQueue){//If no such guest found in the queue, the agent is available
                    Agent.findOneAndUpdate({rainbowId:agent.rainbowId}, {$set:{'available':true}}).then(function(){
                        console.log("Agent has been made available");
                        res.send("Agent has been made available");
                    }).catch(next);
                }else{//If some guest found, assign the agent to the guest
                    Queue[agent.category].findByIdAndUpdate({_id:guestInQueue._id}, {$set:{'agentId':agent.rainbowId, 'agentName':agent.name}}).then(function(){
                        console.log("Agent has been reassigned");
                        res.send("Agent has been reassigned");
                    }).catch(next);
                }
            });
        }
    }).catch(next);
});

router.patch("/review", function(req, res, next){
    
    try{
        //Check if neccessary inputs are received
        console.log('PATCH: api/review');
        if(!req.query.rating1){
            throw new Error("PATCH Request Needs 'Rating1' Number Parameter");
        }
        if(!req.query.rating2){
            throw new Error("PATCH Request Needs 'Rating2' Number Parameter");
        }
        if(!req.query.agentId){
            throw new Error("PATCH Request Needs 'AgentId' String Parameter");
        }
    }catch(e){
            return next(e);
    }
    Agent.findOne({rainbowId: req.query.agentId}).then(function(agent){
        //Update the average rating values
        var newNumberOfRating;
        var newAverage1;
        var newAverage2;
        if(agent.numberOfRating==0){
            newNumberOfRating = 1;
            newAverage1 = req.query.rating1;
            newAverage2 = req.query.rating2;
        }else{
            newNumberOfRating = agent.numberOfRating+1;
            newAverage1 = agent.averageRating1*agent.numberOfRating/newNumberOfRating+req.query.rating1/newNumberOfRating;
            newAverage2 = agent.averageRating2*agent.numberOfRating/newNumberOfRating+req.query.rating2/newNumberOfRating;
        }
        //If comment found, insert into feedbacks array
        if(!req.query.email || !req.query.comment){
            Agent.findByIdAndUpdate(agent._id, {
                $set:{'averageRating1': newAverage1, 'averageRating2': newAverage2, 'numberOfRating':newNumberOfRating}}).then(function(){
                res.send("Rating Updated");
            }).catch(next);
        }else{
            Agent.findByIdAndUpdate(agent._id, {
                $push:{'feedbacks':{'email':req.query.email, 'comment':req.query.comment}},
                $set:{'averageRating1': newAverage1, 'averageRating2': newAverage2, 'numberOfRating':newNumberOfRating}}).then(function(){
                res.send("Rating Updated");
            }).catch(next);
        }
        
    }).catch(next);

});

router.post("/agents", function(req,res,next){
    console.log('POST received');
    Agent.create({name:req.query.name, rainbowId:req.query.rainbowId, available:true, 
        category:req.query.category, averageRating1: 0, averageRating2:0, numberOfRating:0,
    feedbacks:new Array}).then(function(agent){
        res.send(agent);
    }).catch(next);
});

router.delete("/queue", function(req,res,next){
    try {
        //Check if neccessary inputs are received
        console.log('DELETE: api/queue');
        if (!req.query.token) {
            throw new Error("DELETE Request Needs 'token' String Parameter");
        }
    } catch (e) {
        return next(e);
    }
    Queue.deleteOne({token:req.query.token}).then(function(response){
        if (response.deletedCount) {
            res.send("Queue Number Deleted")
        } else {
            res.send("Queue Number Not Found")
        }

    });
});

module.exports = router;
