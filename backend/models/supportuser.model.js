const mongoose = require("mongoose");

const supportUserScheme = new mongoose.Schema({
    chat_id: {
        type: String,
        required: true,
    },
    action: {
        type: String,
    },
    set_status: {
        type: String,
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
},{ timestamps: true })

const SupportUser = mongoose.model("support_user", supportUserScheme);

module.exports = SupportUser;