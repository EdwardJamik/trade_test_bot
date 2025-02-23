const mongoose = require("mongoose");

const UserProgressScheme = new mongoose.Schema({
    chat_id: {
        type: String,
        required: true
    },
    module_id:{
        type: String,
    },
    task:{
        type: String,
    },
    task_send:{
        type: Date,
    },
    test:{
        type: String,
        required: false,
        default:null,
    },
    test_send:{
        type: Date,
    },
    point:{
        type: Number,
        default: 0
    },
    confirm:{
        type: Boolean,
        default: false,
    },
    last_message:{
        type: String
    },
    createdAt: {
        type: Date,
        // default: Date.now
    },
    updatedAt: {
        type: Date,
        // default: Date.now
    },
},{ timestamps: true })

const UserProgress = mongoose.model("UserProgress", UserProgressScheme);

module.exports = UserProgress;