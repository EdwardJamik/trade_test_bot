const mongoose = require("mongoose");

const fillingList = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique:true,
    },
    filling:{
        type: String,
    },
    type:{
        type: String,
        enum:['button','text']
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
},{ timestamps: true })

const FillingList = mongoose.model("Filling", fillingList);

module.exports = FillingList;