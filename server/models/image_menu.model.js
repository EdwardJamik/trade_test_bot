const mongoose = require("mongoose");

const ImageMenuScheme = new mongoose.Schema({
    info_photo: {
        type: String,
    },
    help_photo:{
        type: String,
    },
    product_photo:{
        type: String,
    },
    resource_photo:{
        type: String,
    },
    cabinet_photo:{
        type: String,
    },
    start_video:{
        type: String,
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
},{ timestamps: true })

const ImageList = mongoose.model("image_menu", ImageMenuScheme);

module.exports = ImageList;