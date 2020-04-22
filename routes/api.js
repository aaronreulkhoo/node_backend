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

//check authentication of the request
function checkAuth(req,res,next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !=="undefined"){
        const bearer = bearerHeader.split(' ');
        req.auth=bearer[1];
        next()
    } else {
        res.sendStatus(401);
    }
}


let language = "en-US";
let ttl = 86400; // active for a day

//get all agents' information
router.get("/status", checkAuth, async (req, res, next) => {
    Agent.find({}, function(err, agents) {
        res.send(agents);  
    });
});

//Update Agent's Feedbacks
router.patch("/review", checkAuth, function(req, res, next){
    
    try{
        //Check if neccessary inputs are received
        console.log('PATCH: api/review');
        if(!req.query.rating1){
            throw new Error("PATCH Request Needs 'Rating1' Number Parameter");
        }
        if(!req.query.rating2){
            throw new Error("PATCH Request Needs 'Rating2' Number Parameter");
        }
        if(!req.query.rating3){
            throw new Error("PATCH Request Needs 'Rating3' Number Parameter");
        }
        if(!req.query.agentId){
            throw new Error("PATCH Request Needs 'AgentId' String Parameter");
        }
        if(req.query.rating1<0 || req.query.rating1>5){
            throw new Error("'Rating1' Exceeds Threshold Value");
        }
        if(req.query.rating2<0 || req.query.rating2>5){
            throw new Error("'Rating2' Exceeds Threshold Value");
        }
        if(req.query.rating3<0 || req.query.rating3>5){
            throw new Error("'Rating3' Exceeds Threshold Value");
        }
    }catch(e){
            return next(e);
    }
    Agent.findOne({rainbowId: req.query.agentId}).then(function(agent){
        if(!agent){
            throw new Error("Invalid Agent ID");
        }else{
            //Update the average rating values
            var newNumberOfRating;
            var newAverage1;
            var newAverage2;
            var newAverage3;
            if(agent.numberOfRating==0){
                newNumberOfRating = 1;
                newAverage1 = req.query.rating1;
                newAverage2 = req.query.rating2;
                newAverage3 = req.query.rating3;
            }else{
                newNumberOfRating = agent.numberOfRating+1;
                newAverage1 = agent.averageRating1*agent.numberOfRating/newNumberOfRating+req.query.rating1/newNumberOfRating;
                newAverage2 = agent.averageRating2*agent.numberOfRating/newNumberOfRating+req.query.rating2/newNumberOfRating;
                newAverage3 = agent.averageRating3*agent.numberOfRating/newNumberOfRating+req.query.rating3/newNumberOfRating;
            }
            //If comment found, insert into feedbacks array
            if(!req.query.email || !req.query.comment){
                Agent.findByIdAndUpdate(agent._id, {
                    $set:{'averageRating1': newAverage1, 'averageRating2': newAverage2, 'averageRating3': newAverage3, 'numberOfRating':newNumberOfRating}}).then(function(){
                    res.send("Rating Updated Without Comment");
                }).catch(next);
            }else{
                Agent.findByIdAndUpdate(agent._id, {
                    $push:{'feedbacks':{'email':req.query.email, 'comment':req.query.comment}},
                    $set:{'averageRating1': newAverage1, 'averageRating2': newAverage2, 'averageRating3': newAverage3,'numberOfRating':newNumberOfRating}}).then(function(){
                    res.send("Rating Updated With Comment");
                }).catch(next);
            }
        }
    
        
    }).catch(next);

});

//Add New Agent
router.post("/agents", checkAuth, function(req,res,next){
    try{
        console.log('POST received');
        if(!req.query.name){
            throw new Error("POST Request Needs 'Name' String Parameter");
        }
        if(!req.query.rainbowId){
            throw new Error("POST Request Needs 'RainbowId' String Parameter");
        }
        if(!req.query.category){
            throw new Error("POST Request Needs 'Category' Number Parameter");
        }
        if(req.query.category<0 || req.query.category>4){
            throw new Error("'Category' Exceeds Threshold Value");
        }
    }catch(e){
        return next(e);
    }
    Agent.create({name:req.query.name, rainbowId:req.query.rainbowId, available:true, 
    category:req.query.category, averageRating1: 0, averageRating2:0, numberOfRating:0,
    feedbacks:new Array}).then(function(agent){
        res.send("New Agent Is Created");
    }).catch(next);
});

//Delete One from Queue
router.delete("/queue", checkAuth, function(req,res,next){
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
