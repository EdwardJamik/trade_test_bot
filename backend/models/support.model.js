const mongoose = require("mongoose");

const supportScheme = new mongoose.Schema({
    chat_id: {
        type: String,
        required: true,
    },
    support_chat_id: {
        type: String,
        default:'null',
    },
    username:{
        type: String,
    },
    first_name:{
        type: String,
    },
    phone:{
        type: String,
        default:null,
    },
    userFirstName:{
        type: String,
    },
    userCity:{
        type: String,
    },
    type:{
        type: String,
        enum: ['Viber', 'Telegram'],
    },
    messages: {
        type: Array,
    },
    main_message: {
        type: String,
    },
    direction:{
        type: String,
        enum: ['Cosmetology', 'Hairdressing', 'Other'],
        default:''
    },
    close:{
        type: Boolean,
        default:false
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

const SupportList = mongoose.model("support", supportScheme);

module.exports = SupportList;