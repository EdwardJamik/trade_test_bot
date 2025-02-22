const Filling = require("../models/filling.model");

async function getFillingText(code) {
    const fillingRecord = await Filling.findOne({ code });

    if (!fillingRecord) {
        console.log("Filling record not found");
        return "";
    }
    return fillingRecord.filling;
}

module.exports.getFillingText = getFillingText