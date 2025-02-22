const mongoose = require("mongoose");

const SendingList = new mongoose.Schema({
    date: {
        type: Date,
    },
    content:{
        type: String,
    },
    image:{
        type: Array,
        default: null
    },
    watch:{
        type: Array,
        default: null
    },
    viber:{
        type: Boolean,
        default:false,
    },
    telegram:{
        type: Boolean,
        default:false,
    },
    un_sending_viber:{
        type: String,
    },
    sending_viber:{
        type: String,
    },
    un_sending_telegram:{
        type: String,
    },
    sending_telegram:{
        type: String,
    },
    accepting_viber:{
        type: Boolean,
        default:false
    },
    accepting_telegram:{
        type: Boolean,
        default:false
    },
    sending_users:{
        type: Array,
    },
    type:{
        type: Array,
    },
    type_sendings:{
        type: String,
    },
    store_link:{
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

const Sendings = mongoose.model("sending_list", SendingList);

module.exports = Sendings;