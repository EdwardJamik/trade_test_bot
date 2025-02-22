const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    root: {
        type: Boolean,
        required: true,
        default:false
    },
    passwordHash:{
        type: String,
        required: true,
    },
    userCount:{
        type: Number,
        default: 0
    },
    entree:{
        type: Array,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
})

const Admin = mongoose.model("admin", adminSchema);

module.exports = Admin;