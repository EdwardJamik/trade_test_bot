const mongoose = require("mongoose");

const GalleryScheme = new mongoose.Schema({
    chat_id: {
        type: String,
        required: true,
    },
    file_id:{
        type: String,
        required: true,
    },
    title:{
        type: String,
        required: true,
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

const GalleryList = mongoose.model("Gallery", GalleryScheme);

module.exports = GalleryList;