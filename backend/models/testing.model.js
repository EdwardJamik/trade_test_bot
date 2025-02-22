const mongoose = require("mongoose");

const TestingList = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    tests:{
        type: Array,
    },
    created_user: {
        type: String,
        required: true
    },
    updated_user: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
},{ timestamps: true })

const Testing = mongoose.model("Tests", TestingList);

module.exports = Testing;