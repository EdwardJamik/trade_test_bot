const mongoose = require("mongoose");

const moduleList = new mongoose.Schema({
    title:{
        type: String,
        required:true
    },
    message:{
        type: String,
        required:true
    },
    date:{
        type: Date,
        required:true
    },
    photo:{
        type: String,
        default:null
    },
    video:{
        type: Array,
        default: null
    },
    other_files:{
        type: Array,
        default:null
    },
    test_id:{
        type: String,
    },
    task_id:{
        type: Array,
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
},{ timestamps: true })

const ModuleList = mongoose.model("Modules", moduleList);

module.exports = ModuleList;