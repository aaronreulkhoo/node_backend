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
        type: Number,
        required: [true, "Availability field required"]
    },
    working: {
        type: Number,
        required: [true, "Availability field required"]
    },
    category: {
        type: Number,
        required: [true, "Category field required"]
    },
    averageRating1: {
        type: Number,
        required: [true, "AverageRating1 field required"]
    },
    averageRating2: {
        type: Number,
        required: [true, "AverageRating2 field required"]
    },
    averageRating3: {
        type: Number,
        required: [true, "AverageRating3 field required"]
    },
    numberOfRating: {
        type: Number,
        required: [true, "numberOfRating field required"]
    },
    feedbacks: {
        type: Array,
        required: [true, "Comments field required"]
    }
});

const Agent = mongoose.model('agent', AgentSchema);

module.exports = Agent;
