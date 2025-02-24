const mongoose = require("mongoose");

const MailingList = new mongoose.Schema({
    date: {
        type: Date,
    },
    message:{
        type: String,
    },
    file:{
        type: String,
        default: null
    },
    start_send:{
        type: Boolean,
        default: false,
    },
    confirm_send:{
        type: Boolean,
        default: false,
    },
    sending_users:{
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
},{ timestamps: true })

const Mailing = mongoose.model("mailing", MailingList);

module.exports = Mailing;