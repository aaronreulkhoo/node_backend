const express = require('express');
const bodyParser=require('body-parser');
const db = require('./db');
const cors = require('cors');

const PORT = process.env.PORT || 3000;

/*
This function creates the Express server which serves as the RESTful API endpoint.
*/
async function createServer() {
    const app = express();
    try {
        await db.connect();
    } catch (error) {
        console.error('Unable to connect to Atlas Cluster', error);
        process.exit(1);
    }

    app.use(cors());
    app.use(express.static('public')); // serve simple html
    app.use(bodyParser.json()); //middleware
    app.use('/api', require('./routes/api')); // route setup

    /*
    This middleware function standardises the error response to a 422 Unprocessable Entity status, and return the specific error message.
    */
    app.use(function(err, req, res, next) {
        console.log(err.message);
        res.status(422).send({error: err.message})
    });

// api
    app.listen(PORT, () => {
        console.log(`Server listening to Port ${PORT}...`);
    });
}
createServer();
