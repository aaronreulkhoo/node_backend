const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QueueSchema = new Schema({
    category: {
        type: Number,
        required: [true, "Category field required"]
    },
    token: {
        type: String, 
        required: [true, "Token field required"]
    }, 
    marker: {
        type: Boolean, 
        required: [true, "Marker field required"]
    }, 
    agentName: {
        type: String, 
        required: [true, "Agent Name field required"]
    }
}, {timestamps: true });

const Queue = mongoose.model('queue', QueueSchema);

module.exports = Queue;
