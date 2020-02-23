const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AgentSchema = new Schema({
    name:{
        type: String,
        required: [true, "Name field required"]
    },
    rainbowId: {
        type: String,
        required: [true, "Rainbow ID field required"]
    },
    available: {
        type: Boolean,
        required: [true, "Availability field required"]
    },
    category: {
        type: Number,
        required: [true, "Category field required"]
    }
});

const Agent = mongoose.model('agent', AgentSchema);

module.exports = Agent;
