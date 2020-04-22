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


/*
This function loads the Rainbow SDK object.
*/
async function loadRainbow() {
    try {
        await rainbowSDK.start();
        console.log("Connected to Rainbow SDK!")
    } catch (error) {
        console.error('Unable to connect to Rainbow API', error);
        process.exit(1);
    }
}
// loadRainbow();


// Variables for Rainbow guest account creation
let language = "en-US";
let ttl = 3600; // expires after an hour


const db = require('./db');
const Agent = require('./models/agent');
const SocketQueue = require('./models/socketqueue');
const SOCKETPORT = process.env.PORT || 4000;
const cors = require('cors');


/*
This function creates the Express server which serves as the port for web sockets.
*/
async function createSocketServer() {
    const jwt = require('jsonwebtoken');
    const app = require('express')();
    app.use(cors());
    const server = require('http').Server(app);
    const io = require('socket.io')(server);

    // Create connection to MongoDB
    try {
        await db.connect();
    } catch (error) {
        console.error('Unable to connect to Atlas Cluster', error);
        process.exit(1);
    }

    // Opens the port for the Express app to listen to
    server.listen(SOCKETPORT, ()=>{
        console.log(`Socket.io listening to Port ${SOCKETPORT}...`);
    });


    /*
    This creates a GET API endpoint which simulates a JSON web token being passed back post-authentication.
    This web token has a default expiry time of 2 hours (requiring another sign-in).
    */
    app.get("/login", async function (req,res) {
        const adminDetails = {adminName:"someAdmin"};
        console.log("An Admin Has Logged In");
        await jwt.sign({adminDetails: adminDetails},"serverKey",(err, auth) => {res.json({
                auth:auth
            });
        })
    });

    /*
    This middleware function parses the 'authorization' header for previously generated JSON web tokens for protected API endpoints.
    This header is not directly accessible by end users.
    If not provided or invalid, it responds with a 401 Unauthorised status response.
    */
    function checkAuth(req,res,next) {
        const bearerHeader = req.headers['authorization'];
        if (typeof bearerHeader !=="undefined"){
            const bearer = bearerHeader.split(' ');
            req.auth=bearer[1];
            next()
        } else {
            res.sendStatus(401)
        }
    }


    /*
    This creates a POST API endpoint for agents to be put inside the queueing database manually.
    >>> This is a protected endpoint.
    */
    app.post("/agents", checkAuth, function(req,res) {
        jwt.verify(req.auth, "serverKey", (err, authData) => {
            if (err) {
                res.sendStatus(401)
            } else {
                Agent.create({
                    name: req.query.name,
                    rainbowId: req.query.rainbowId,
                    available: 1,
                    working: 0,
                    category: req.query.category
                }).then((agent) => {
                    res.send(agent);
                })
            }
        })
    });

    /*
    This creates a PATCH API endpoint for agents' working status to be toggled.
    >>> This is a protected endpoint.
    */
    app.patch("/admin/working", checkAuth, function(req,res) {
        jwt.verify(req.auth, "serverKey", (err, authData) => {
            if (err) {
                res.sendStatus(401)
            } else {
                if(!req.query.rainbowId){
                    res.sendStatus(400);
                } else {
                    console.log(req.query.rainbowId);
                    Agent.findOneAndUpdate({rainbowId: req.query.rainbowId}, {$bit: {working: {xor: 1}}})
                        .then((agent) => {
                        res.send(agent);
                    })
                }
            }
        })
    });

    /*
    This creates a PATCH API endpoint for agents' availability to be toggled.
    >>> This is a protected endpoint.
    */
    app.patch("/admin/available", checkAuth, function(req,res) {
        jwt.verify(req.auth, "serverKey", (err, authData) => {
            if (err) {
                res.sendStatus(401)
            } else {
                if(!req.query.rainbowId){
                    res.sendStatus(400);
                } else {
                    console.log(req.query.rainbowId);
                    Agent.findOneAndUpdate({rainbowId: req.query.rainbowId}, {$bit: {available: {xor: 1}}})
                        .then((agent) => {
                            res.send(agent);
                        })
                }
            }
        })
    });


    /*
    This creates a GET API endpoint for the Admin dashboard to retrieve all agent information.
    >>> This is a protected endpoint.
    */
    app.get("/admin", checkAuth, function (req,res) {
        jwt.verify(req.auth,"serverKey", (err,authData) => {
            if (err) {
                res.sendStatus(401)
            } else {
                Agent.find().then((agents) => {
                    res.send(agents);
                })
            }
        })
    });


    /*
    This serves a basic HTML file which can be used to check if the server is up.
    */
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/socket_public/index.html');
    });


    /*
    This middleware function screens out incoming socket connections without a valid application signature preventing spam connections.
    If not provided or invalid, it rejects the connection.
    */
    const socketKey= "BBO5e7IVtK9TeSAQ3RTYGsQOWOZ0QAe8k9jbvomydoOUEjK1lwTLIkK4J3yu";
    io.use(function(socket, next){
        if (socket.handshake.query && socket.handshake.query.key){
            if (socket.handshake.query.key===socketKey) {
                next();
            } else {
                console.log("Authentication Failed, Connection Rejected");
                next(new Error('Authentication error'));
            }
        } else {
            console.log(", Connection Rejected");
            next(new Error('Authentication error'));
        }
    });


    /*
    This method is where all socket event handlers and listeners are mounted.
    The namespace of the socket variable is treated with respect to each individual socket variable,
    hence all sockets will have the same handlers and procedures attached.
    */
    io.sockets.on('connection', function (socket) {
        /*
        This code automatically fires off the 'handshake' event which sends the socket id to the client.
        This signifies that the application connecting has been verified.
        */
        console.log(socket.id+" Connected");
        console.log(Object.keys(io.engine.clients));
        socket.emit('handshake', {
            socketId: socket.id
        });

        /*
        This is the event handler for the 'getAgent' event emitted by the client. When triggered:
        1) Creates the queue object and stores the category associated with it.
        2) Creates the guest account using the incoming data.
        3) Attempts to find and update an agent which is available.
        4) Creates the queue object for the incoming socket, with or without the agent assigned.
        5) If an agent is available, the 'getAgentSuccess' event is fired with the agent's rainbowID, name, and guest token attached.
        */
        socket.on('getAgent', async function (data) {
            try {
                socket['category']=data.category;
                let queue = await SocketQueue[data.category].create({ token: "Null", socketId:socket.id, agentId:"Null", agentName: "Null"});
                // Hardcoded token for rainbow failures
                let token = { token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb3VudFJlbmV3ZWQiOjAsIm1heFRva2VuUmVuZXciOjcsInVzZXIiOnsiaWQiOiI1ZTlmYmYyYTljZmY2YjcyNzlhOWY3MzciLCJsb2dpbkVtYWlsIjoicGJzN21teDdhZTB0bHZwdDQzOHhtd3hodDJ0c2Z3YmdhNnR0cWZ2NkBhNThjZmFjMDViMDcxMWVhYmY3ZTc3ZDE0ZTg3YjkzNi5zYW5kYm94Lm9wZW5yYWluYm93LmNvbSJ9LCJhcHAiOnsiaWQiOiJhNThjZmFjMDViMDcxMWVhYmY3ZTc3ZDE0ZTg3YjkzNiIsIm5hbWUiOiJhY29ybi1iYWNrZW5kIn0sImlhdCI6MTU4NzUyNzQ2NywiZXhwIjoxNTg4ODIzNDY3fQ.kGVB3vrkRQKoZeRKweqXI0y4Gl-Ck3nJnd8KPnZpEwwckOAFECXQRR4Y7ThtWvVNccvx8ry8-m3sN_kYmOZ5x-YBw3JsHv6mWRNvUGoZI1Xz3y_C1WznMioShUIzFvzo2nMQOxFZbVJawwJloKVjg6k3mW4fqKFfvjqAvi4deK84SqxLVizGyiotOGbpea46J9Fnvc81SE1PF_KISOkn5Uuj3g8JqAGz2nD8ia5YtKbTq-FwBhWkV7POIQkuSVxAGVBzFPeEdr6aRXXx27qhhlHoqytcP9EkhZeLk-msBvPTmBvNFguj2zAHO5PJNXkD-78Y3WxUXI5uCK8XWymirw'};
                // let guest = await rainbowSDK.admin.createGuestUser(data.firstName, data.lastName, language, ttl);
                // let token = await rainbowSDK.admin.askTokenOnBehalf(guest.loginEmail, guest.password);
                let agent = await Agent.findOneAndUpdate({available: 1, category: data.category, working: 1},{$set:{available:0}});
                console.log(agent);
                if(agent) {
                    await SocketQueue[data.category].findByIdAndUpdate({_id:queue._id}, {$set:{token:token.token, agentId: agent.rainbowId, agentName:agent.name}});
                    socket.emit("getAgentSuccess",{agentId:agent.rainbowId,agentName:agent.name, token:token.token});
                    console.log("And Agent Was Assigned");
                } else {
                    let agents = await Agent.find({category: data.category, working: 1});
                    console.log(agents);
                    if (agents.length!==0) {
                        await SocketQueue[data.category].findByIdAndUpdate({_id:queue._id}, {$set:{token:token.token}});
                        console.log("But No Agent Was Available");
                    } else {
                        socket.emit('noAgentsWorking');
                        console.log("But No Agents Are Working Right Now");
                    }
                }
            } catch (e) {
                console.log("An Error Was Caught");
                console.log(e.message);
            }
        });


        /*
        This is the event handler for the 'disconnect' event that is automatically triggered on a socket close. When triggered:
        1) Retrieves and deletes the associated queue object in the database.
        2) If an agent was assigned, it searches for the earliest queue object by time in that same category without an agent.
        3) If there is a person waiting, it reassigns the agent to that queue object and emits the 'getAgentSuccess' event to that socket,
           otherwise, it makes the agent available.
        */
        socket.on('disconnect', async function () {
            try {
                console.log(socket.id+" Disconnected");
                let guestLeftQueue= await SocketQueue[socket['category']].findOneAndDelete({socketId:socket.id});
                if (guestLeftQueue) {
                    console.log("Queue Number Deleted");
                } else {
                    console.log("Error Deleting Queue Number");
                    return;
                }
                if (guestLeftQueue.agentId!=="Null") {
                    let nextInQueue = await SocketQueue[socket['category']].findOne({agentId:"Null"}).sort({created_at: 1});
                    if(nextInQueue){
                        await SocketQueue[socket['category']].findByIdAndUpdate({_id:nextInQueue._id}, {$set:{agentId: guestLeftQueue.agentId, agentName:guestLeftQueue.agentName}});
                        io.to(`${nextInQueue.socketId}`).emit("getAgentSuccess",{agentId:guestLeftQueue.agentId,agentName:guestLeftQueue.agentName, token:nextInQueue.token});
                        console.log("And Agent Was Reassigned");
                    } else {
                        await Agent.findOneAndUpdate({rainbowId:guestLeftQueue.agentId},{$set:{available:1}});
                        console.log("And Agent Made Available");
                    }
                } else {
                    console.log("But No Agent Was Assigned");
                }
            } catch (e) {
                console.log(e.message)
            } finally {
                console.log(Object.keys(io.engine.clients));
            }
        });

    })
}

createSocketServer();
