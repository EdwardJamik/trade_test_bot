const Filling = require("../models/filling.model");

async function getFillingText(code) {
    const fillingRecord = await Filling.findOne({ code });

    if (!fillingRecord) {
        console.log("Filling record not found");
        return "";
    }
    return fillingRecord.filling;
}

async function getFillingCode  (filling){
    try {
        const {code} = await Filling.findOne({ filling });
        return code;
    } catch (e) {
        console.log(e)
    }
}

module.exports.getFillingText = getFillingText
module.exports.getFillingCode = getFillingCode

