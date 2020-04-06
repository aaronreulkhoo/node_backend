/*-----------------------Setting up Rainbow SDK*/
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

// Variables for guest
let guestFirstname = "James";
let guestLastname = "Dupont";
let language = "en-US";
let ttl = 86400; // active for a day


/*-----------------------Setting up Server*/
const db = require('./db');
const Agent = require('./models/agent');
const SocketQueue = require('./models/socketqueue');
const SOCKETPORT = process.env.PORT || 4000;


async function createSocketServer() {
    const app = require('express')();
    const server = require('http').Server(app);
    const io = require('socket.io')(server);

    // Connect to Mongo
    try {
        await db.connect();
    } catch (error) {
        console.error('Unable to connect to Atlas Cluster', error);
        process.exit(1);
    }

    server.listen(SOCKETPORT, ()=>{
        console.log(`Socket.io listening to Port ${SOCKETPORT}...`);
    });

    app.post("/agents", function(req,res,next){
        console.log('POST received');
        Agent.create({name:req.query.name, rainbowId:req.query.rainbowId, available:true, category:req.query.category, clientSocketId: "Null"}).then(function(agent){
            res.send(agent);
        }).catch(next);
    });

    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/public/index.html');
    }); // serve simple html

    //Handle Connections
    io.on('connection', function (socket) {
        // HANDSHAKE
        console.log(socket.id+" connected");
        console.log(Object.keys(io.engine.clients));
        socket.emit('handshake', {
            socketId: socket.id
        });

        // GET
        socket.on('getAgent', async function (data) {
            try {
                let guest = await rainbowSDK.admin.createGuestUser(guestFirstname, guestLastname, language, ttl);
                let agent = await Agent.findOneAndUpdate({available: true, category: data.category},{$set:{available:false}});
                // console.log(agent);
                let token = await rainbowSDK.admin.askTokenOnBehalf(guest.loginEmail, guest.password);
                if(agent) {
                    SocketQueue.create({category:data.category, token:token.token, socketId:socket.id, agentId:agent.rainbowId,agentName:agent.name}).then(() => {
                        socket.emit("getAgentSuccess",{agentId:agent.rainbowId,agentName:agent.name, token:token.token});
                    }).catch();
                } else {
                    SocketQueue.create({category:data.category, token:token.token, socketId:socket.id, agentId:"Null", agentName: "Null"})
                }
            } catch (e) {
                console.log(e.message);
            }
        });

        // LEAVING
        socket.on('disconnect', async function () {
            console.log(socket.id+" disconnected");
            console.log(Object.keys(io.engine.clients));
            try {
                let guestLeftQueue= await SocketQueue.findOneAndDelete({socketId:socket.id});
                // console.log(guestLeftQueue);
                if (guestLeftQueue) {
                    console.log("Queue Number Deleted");
                    if (guestLeftQueue.agentId!=="Null") {
                        let guestInQueue = await SocketQueue.findOne({category:guestLeftQueue.category, agentId:"Null"}).sort({created_at: 1});
                        if(guestInQueue){
                            SocketQueue.findByIdAndUpdate({_id:guestInQueue._id}, {$set:{agentId: guestLeftQueue.agentId, agentName:guestLeftQueue.agentName}}).then(() => {
                                console.log("And Agent Reassigned");
                            }).catch();
                            io.to(`${guestInQueue.socketId}`).emit("getAgentSuccess",{agentId:guestLeftQueue.agentId,agentName:guestLeftQueue.agentName, token:guestInQueue.token});
                        } else {
                            Agent.findOneAndUpdate({rainbowId:guestLeftQueue.agentId}, {$set:{available:true}}).then(() => {
                                console.log("And Agent Made Available");
                            }).catch();
                        }
                    } else {
                        console.log("But No Agent Assigned");
                    }
                } else {
                    console.log("Error Deleting Queue Number")
                }
            } catch (e) {
                console.log(e.message)
            }
        });

    })

}

createSocketServer();
