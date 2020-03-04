const express = require('express');
const router=express.Router();
const Agent = require('../models/agent');
const Queue = require('../models/queue');

//mounting handlers
router.get("/agents", async(req,res,next) => {
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

router.post("/agents", function(req,res,next){
    console.log('POST received');
    Agent.create(req.body).then(function(agent){
        res.send(agent);
    }).catch(next);
});

router.patch("/agents/:id", async (req,res) => { // sync must catch errors
    console.log('PUT received');
    Agent.updateOne({_id:req.params.id}, req.body).then(function(agent){
        res.send(agent)
        //TODO: Scan and remove waiting people from queue
        //Queue.findOneAndRemove({category:req.category}, function(err, removed){
        //    res.send(removed);
        //});
    });
});

router.delete("/agents/:id", function(req,res,next){
    console.log('DELETE received');
    res.send({type:"DELETE"});
});

module.exports = router;
