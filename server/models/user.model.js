const mongoose = require("mongoose");

const telegramUserScheme = new mongoose.Schema({
    chat_id: {
        type: String,
        required: true,
        unique:true,
    },
    username:{
        type: String,
    },
    first_name:{
        type: String,
    },
    last_name:{
        type: String,
    },
    phone:{
        type: String,
        required: false,
        default:null,
    },
    points:{
        type: Number,
        default: 0
    },
    ban:{
        type: Boolean,
        default: false,
    },
    user_ban:{
        type: Boolean,
        default: false,
    },
    action:{
        type: String,
    },
    last_message:{
        type: String
    },
    last_two_message:{
        type: String
    },
    language:{
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

const UserList = mongoose.model("Users", telegramUserScheme);

module.exports = UserList;