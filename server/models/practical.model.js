const mongoose = require("mongoose");

const practicalList = new mongoose.Schema({
    title:{
        type: String,
        required:true
    },
    message:{
        type: String,
        required:true
    },
    photo:{
        type: String,
        default:null
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
},{ timestamps: true })

const PracticalList = mongoose.model("Practical", practicalList);

module.exports = PracticalList;