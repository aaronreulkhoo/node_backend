const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QueueSchema = new Schema({
    guestFirstName: {
        type: String,
        required: [true, "GuestFirstName field required"]
    },
    guestLastName: {
        type: String,
        required: [true, "GuestLastName field required"]
    },
    token: {
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

const Queue0 = mongoose.model('queue0', QueueSchema);
const Queue1 = mongoose.model('queue1', QueueSchema);
const Queue2 = mongoose.model('queue2', QueueSchema);
const Queue3 = mongoose.model('queue3', QueueSchema);
const Queue4 = mongoose.model('queue4', QueueSchema);



module.exports = {
    0 : Queue0,
    1 : Queue1,
    2 : Queue2,
    3 : Queue3,
    4 : Queue4
};
