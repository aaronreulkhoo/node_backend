const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SocketQueueSchema = new Schema({
    token: {
        type: String,
        required: [true, "Token field required"]
    },
    socketId: {
        type: String,
        required: [true, "Token field required"]
    },
    agentId: {
        type: String,
        required: [true, "AgentId field required"]
    },
    agentName: {
        type: String,
        required: [true, "Agent Name field required"]
    }
}, {timestamps: true });

const SocketQueue0 = mongoose.model('queue0', SocketQueueSchema);
const SocketQueue1 = mongoose.model('queue1', SocketQueueSchema);
const SocketQueue2 = mongoose.model('queue2', SocketQueueSchema);
const SocketQueue3 = mongoose.model('queue3', SocketQueueSchema);
const SocketQueue4 = mongoose.model('queue4', SocketQueueSchema);

module.exports = {
    0 : SocketQueue0,
    1 : SocketQueue1,
    2 : SocketQueue2,
    3 : SocketQueue3,
    4 : SocketQueue4
};
