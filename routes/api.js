const express = require('express');
const router=express.Router();
const Agent = require('../models/agent');

/*
This PATCH endpoint is where requests are taken to update the individual agent's feedback in the database by clients.
*/
router.get("/login", async function (req,res) {
    const adminDetails = {adminName:"someAdmin"};
    console.log("An Admin Has Logged In");
    await jwt.sign({adminDetails: adminDetails},"serverKey",(err, auth) => {res.json({
            auth:auth
        });
    })
});



router.get("/status", checkAuth, async (req, res, next) => {
    jwt.verify(req.query.auth, "serverKey", (err, authData) => {
        if (err) {
            res.sendStatus(401);
        }else{
            Agent.find({}, function(err, agents) {
                res.send(agents);
            });
        }
    });
});

router.patch("/review", function(req, res, next){
    try{
        // These methods check the incoming input, and throws an error which is caught by the next() middleware function.
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
    } catch(e) {
        return next(e);
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
            if(!req.query.auth){
                throw new Error("PATCH Request Needs 'Auth' String Parameter");
            }
    }catch(e){
            return next(e);
    }

if(req.query.auth===serverKey){
        Agent.findOne({rainbowId: req.query.agentId}).then(function(agent){
            if(!agent){
                throw new Error("Invalid Agent ID");
            }else{
                //Update the average rating values
                var newNumberOfRating;
                var newAverage1;
                var newAverage2;
                var newAverage3;
                if(agent.numberOfRating===0){
            newNumberOfRating = 1;
            newAverage1 = req.query.rating1;
            newAverage2 = req.query.rating2;
            newAverage3 = req.query.rating3;
        } else {
            newNumberOfRating = agent.numberOfRating+1;
            newAverage1 = agent.averageRating1*agent.numberOfRating/newNumberOfRating+req.query.rating1/newNumberOfRating;
            newAverage2 = agent.averageRating2*agent.numberOfRating/newNumberOfRating+req.query.rating2/newNumberOfRating;
            newAverage3 = agent.averageRating3*agent.numberOfRating/newNumberOfRating+req.query.rating3/newNumberOfRating;
        }
        //If comment found, insert into feedbacks array
        if(!req.query.email || !req.query.comment){
            Agent.findByIdAndUpdate(agent._id, {
                $set:{'averageRating1': newAverage1, 'averageRating2': newAverage2, 'averageRating3': newAverage3, 'numberOfRating':newNumberOfRating}}).then(function(){
                res.send("Rating UpdatedWithout Comment");
            }).catch(next);
        } else {
            Agent.findByIdAndUpdate(agent._id, {
                $push:{'feedbacks':{'email':req.query.email, 'comment':req.query.comment}},
                $set:{'averageRating1': newAverage1, 'averageRating2': newAverage2, 'averageRating3': newAverage3,'numberOfRating':newNumberOfRating}}).then(function(){
                res.send("Rating UpdatedWith Comment");
            }).catch(next);
            }
        }).catch(next);
    }else{
        res.sendStatus(401);
    }
});

/*
This POST endpoint is where agents are inserted into the feedback database by an administrator.
*/
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
    jwt.verify(req.query.auth, "serverKey", (err, authData) => {
        if (err) {
            res.sendStatus(401);
        }else{
        Agent.create({name:req.query.name, rainbowId:req.query.rainbowId, available:true,
            category:req.query.category, averageRating1: 0, averageRating2:0, numberOfRating:0,
            feedbacks:new Array}).then(function(agent){
        res.send("New Agent Is Created");
        }).catch(next);
        }
    });
});


/*
This DELETE endpoint is where agents are removed from the feedback database by an administrator.
*/
router.delete("/queue", checkAuth, function(req,res,next){
    try {
        //Check if neccessary inputs are received
        console.log('DELETE: api/queue');
        if (!req.query.token) {
            throw new Error("DELETE Request Needs 'token' String Parameter");
        }
        if(!req.query.category){
            throw new Error("DELETE Request Needs 'Category' Number Parameter");
        }
    } catch (e) {
        return next(e);
    }
    jwt.verify(req.query.auth, "serverKey", (err, authData) => {
        if (err) {
            res.sendStatus(401)
        }else{
            Queue[req.query.category].findOneAndRemove({token:req.query.token}).then(function(response){
                if (response) {
                    res.send("Queue Number Deleted")
                } else {
                    res.send("Queue Number Not Found")
                }
            });
        }
    });
});

module.exports = router;


/**********************RAINBOW SDK OPTIONS (DEPRECATED ON SOCKETING VERSION)**********************/
// const Queue = require('../models/queue');
// const RainbowSDK = require("rainbow-node-sdk");
// // Options Config for rainbow
// const options = {
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
//         enableConsoleLogs: false,
//         enableFileLogs: false,
//         "level": 'info',
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
//                 maxSize : '10m',
//                 maxFiles : 10 // */
//         }
//     },
//     // IM options
//     im: {
//         sendReadReceipt: true
//     },
//     servicesToStart: {
//         "bubbles":  {
//             "start_up":true,
//         }, //need services :
//         "telephony":  {
//             "start_up":true,
//         }, //need services : _contacts, _bubbles, _profiles
//         "channels":  {
//             "start_up":true,
//         }, //need services :
//         "admin":  {
//             "start_up":true,
//         }, //need services :
//         "fileServer":  {
//             "start_up":true,
//         }, //need services : _fileStorage
//         "fileStorage":  {
//             "start_up":true,
//         }, //need services : _fileServer, _conversations
//         "calllog":  {
//             "start_up":true,
//         }, //need services :  _contacts, _profiles, _telephony
//         "favorites":  {
//             "start_up":true,
//         } //need services :
//     }
// };
// // Rainbow SDK Object
// const rainbowSDK = new RainbowSDK(options);


/**********************RAINBOW SDK LOAD (DEPRECATED ON SOCKETING VERSION)**********************/
// async function loadRainbow() {
//     try {
//         await rainbowSDK.start();
//         console.log("Connected to Rainbow SDK!")
//     } catch (error) {
//         console.error('Unable to connect to Rainbow API', error);
//         process.exit(1);
//     }
// }
// loadRainbow();

// var guestToken;
// let language = "en-US";
// let ttl = 86400; // active for a day

/**********************INITIAL GET FUNCTION (DEPRECATED ON SOCKETING VERSION)**********************/
// router.get("/agents", async(req,res,next) => {
//     try {
//         //Check if neccessary inputs are received
//         console.log('GET: api/agents');
//         if (!req.query.category) {
//             throw new Error("GET Request Needs 'Category' Number Parameter");
//         }
//         if (!req.query.firstName) {
//             throw new Error("GET Request Needs 'FirstName' String Parameter");
//         }
//         if (!req.query.lastName) {
//             throw new Error("GET Request Needs 'LastName' String Parameter");
//         }
//         if(req.query.category>4 || req.query.category<0){
//             throw new Error("'Category' Exceeds Threshold Value");
//         }
//     } catch (e) {
//         return next(e);
//     }
//     //Create Guest With Name
//     rainbowSDK.admin.createGuestUser(req.query.firstName, req.query.lastName, language, ttl).then((guest) => {
//         //Find any agent available
//         Agent.findOneAndUpdate({available: true, category: req.query.category},{$set:{'available':false}}, function(err,agent){
//             rainbowSDK.admin.askTokenOnBehalf(guest.loginEmail, guest.password).then((token)=>{
//                 guestToken = token.token;
//                 if(!agent) {
//                     //No available agent, guest pushed into queue
//                     Queue[req.query.category].create({guestFirstName: req.query.firstName, guestLastName: req.query.lastName, token:token.token, agentId:"Null", agentName: "Null"}).then(function(){
//                         res.send({guestFirstName: req.query.firstName, guestLastName: req.query.lastName,category: req.query.category, agentId:"Null",agentName:"Null", token:token.token});
//                     }).catch(next);
//                 } else {
//                     //Agent available, ready to make connection
//                     res.send({guestFirstName: req.query.firstName, guestLastName: req.query.lastName,category: req.query.category, agentId:agent.rainbowId,agentName:agent.name, token:token.token});
//                 }
//             });
//         }).catch(next);
//     });
// });

/**********************POLLING GET FUNCTION (DEPRECATED ON SOCKETING VERSION)**********************/
// router.get("/queue", async(req,res,next) => {
//     try {
//         //Check if neccessary inputs are received
//         console.log('GET: api/queue');
//         if (!req.query.token) {
//             throw new Error("GET Request Needs 'Token' String Parameter");
//         }
//         if (!req.query.category) {
//             throw new Error("Get Request Needs 'Category' Number Parameter");
//         }
//         if (req.query.category>4 || req.query.category<0) {
//             throw new Error("'Category' Exceeds Threshold Value");
//          }
//     } catch (e) {
//         return next(e);
//     }
//     Queue[req.query.category].findOne({token:req.query.token}).then(function(guestFound) {
//         if(!guestFound){
//             throw new Error('Invalid Queue Token');
//         } else{
//             if(guestFound.agentId!=='Null'){ //If agent has been assigned
//                 Queue[req.query.category].findOneAndDelete({token:req.query.token}).then(function (guestDeleted) {
//                     res.send({guestFirstName: req.query.firstName, guestLastName: req.query.lastName,category: req.query.category, agentId:guestDeleted.agentId, agentName:guestDeleted.agentName, token:guestDeleted.token});
//                 }).catch(next)
//             }else{
//                 res.send({guestFirstName: req.query.firstName, guestLastName: req.query.lastName,category: req.query.category, agentId:guestFound.agentId, agentName:guestFound.agentName, token:guestFound.token});
//             }
//         }
//     }).catch(next);
// });

/**********************SESSION END PATCHING FUNCTION (DEPRECATED ON SOCKETING VERSION)**********************/
// router.patch("/agents", async (req,res, next) => { // sync must catch errors
//     try {
//         //Check if neccessary inputs are received
//         console.log('PATCH: api/agents');
//         if (!req.query.agentId) {
//             throw new Error("PATCH Request Needs 'AgentId' Number Parameter");
//         }
//     } catch (e) {
//         return next(e);
//     }
//     Agent.findOne({rainbowId:req.query.agentId}).then(function(agent){
//         if(!agent){
//             throw new Error('Invalid Agent ID');
//         }else{
//             //Find the eariest guest that is not assigned to an agent
//             Queue[agent.category].findOne({agentId:"Null"}).sort({created_at: 1}).exec(function(err, guestInQueue){
//                 if(!guestInQueue){//If no such guest found in the queue, the agent is available
//                     Agent.findOneAndUpdate({rainbowId:agent.rainbowId}, {$set:{'available':true}}).then(function(){
//                         console.log("Agent has been made available");
//                         res.send("Agent has been made available");
//                     }).catch(next);
//                 }else{//If some guest found, assign the agent to the guest
//                     Queue[agent.category].findByIdAndUpdate({_id:guestInQueue._id}, {$set:{'agentId':agent.rainbowId, 'agentName':agent.name}}).then(function(){
//                         console.log("Agent has been reassigned");
//                         res.send("Agent has been reassigned");
//                     }).catch(next);
//                 }
//             });
//         }
//     }).catch(next);
// });
