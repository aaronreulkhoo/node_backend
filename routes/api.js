const express = require('express');
const router=express.Router();
const Agent = require('../models/agent');

/*
This PATCH endpoint is where requests are taken to update the individual agent's feedback in the database by clients.
*/
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
    }

    Agent.findOne({rainbowId: req.query.agentId}).then(function(agent){
        //Update the average rating values
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

/*
This POST endpoint is where agents are inserted into the feedback database by an administrator.
*/
router.post("/agents", function(req,res,next){
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
        feedbacks:new Array}).then(function(){
        res.send("New Agent Is Created");
    }).catch(next);
});


/*
This DELETE endpoint is where agents are removed from the feedback database by an administrator.
*/
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
