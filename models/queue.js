const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QueueSchema = new Schema({
    guestId: {
        type: String,
        required: [true, "Guest ID field required"]
    },
    category: {
        type: Number,
        required: [true, "Category field required"]
    },
    guestFirstName: {
        type: String,
        required: [true, "guestFirstName field required"]
    },
    guestLastName: {
        type: String,
        required: [true, "guestLastName field required"]
    },
}, {timestamps: true });

const Queue = mongoose.model('queue', QueueSchema);

module.exports = Queue;
