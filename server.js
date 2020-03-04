const express = require('express');
const bodyParser=require('body-parser');
const db = require('./db');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

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
