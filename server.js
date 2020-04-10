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
let language = "en-US";
let ttl = 86400; // active for a day


/*-----------------------Setting up Server*/
const db = require('./db');
const Agent = require('./models/agent');
const SocketQueue = require('./models/socketqueue');
const SOCKETPORT = process.env.PORT || 4000;
const cors = require('cors');


async function createSocketServer() {
    const app = require('express')();
    app.use(cors());
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

    app.post("/agents", async function(req,res){ // api endpoint to put agents into database, assigns to guest if waiting
        console.log('POST received');
        await Agent.create({name:req.query.name, rainbowId:req.query.rainbowId, available:true, category:req.query.category}).then(function(agent){
            res.send(agent);
        }).catch();
        let guestInQueue = await SocketQueue[req.query.category].findOne({agentId:"Null"}).sort({created_at: 1});
        if (guestInQueue) {
            io.to(`${guestInQueue.socketId}`).emit("getAgentSuccess",{agentId:req.query.rainbowId,agentName:req.query.name, token:guestInQueue.token});
        }
    });

    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/public/index.html');
    }); // serve simple html

    app.get("/admin", async function (req,res) {
        await Agent.find().then(function (data) {
            res.send(data);
        })
    });

    //Handle Connections
    io.sockets.on('connection', function (socket) {
        // HANDSHAKE
        console.log(socket.id+" connected");
        console.log(Object.keys(io.engine.clients));
        socket.emit('handshake', {
            socketId: socket.id
        });

        // GET
        socket.on('getAgent', async function (data) {
            try {
                socket['category']=data.category;
                let guest = await rainbowSDK.admin.createGuestUser(data.firstName, data.lastName, language, ttl);
                let agent = await Agent.findOneAndUpdate({available: true, category: data.category},{$set:{available:false}});
                // console.log(agent);
                let token = await rainbowSDK.admin.askTokenOnBehalf(guest.loginEmail, guest.password);
                if(agent) {
                    SocketQueue[data.category].create({token:token.token, socketId:socket.id, agentId:agent.rainbowId,agentName:agent.name}).then(() => {
                        socket.emit("getAgentSuccess",{agentId:agent.rainbowId,agentName:agent.name, token:token.token});
                    }).catch();
                } else {
                    SocketQueue[data.category].create({ token:token.token, socketId:socket.id, agentId:"Null", agentName: "Null"})
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
                let guestLeftQueue= await SocketQueue[socket['category']].findOneAndDelete({socketId:socket.id});
                console.log(guestLeftQueue);
                if (guestLeftQueue) {
                    console.log("Queue Number Deleted");
                    if (guestLeftQueue.agentId!=="Null") {
                        let guestInQueue = await SocketQueue[socket['category']].findOne({agentId:"Null"}).sort({created_at: 1});
                        console.log(guestInQueue);
                        if(guestInQueue){
                            SocketQueue[socket['category']].findByIdAndUpdate({_id:guestInQueue._id}, {$set:{agentId: guestLeftQueue.agentId, agentName:guestLeftQueue.agentName}}).then(() => {
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
