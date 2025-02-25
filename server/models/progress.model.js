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
        type: Boolean,
        default:false,
    },
    task_data:{
        type: Array,
        default:[],
    },
    task_send:{
        type: Date,
    },
    test:{
        type: Boolean,
        default:false,
    },
    test_send:{
        type: Date,
    },
    material:{
        type: Boolean,
        default: false,
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