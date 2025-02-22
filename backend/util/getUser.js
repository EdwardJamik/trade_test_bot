const User = require("../models/user.model");

async function getRegisteredUser({chat_id}) {
    const findUser = await User.findOne({chat_id})
    return !!findUser
}

async function getUserPhone({chat_id}) {
    const {phone} = await User.findOne({chat_id},{phone:true})
    return phone !== null ? phone : false
}

async function setUserType({chat_id,type_user}) {
    await User.updateOne({chat_id},{type_user})
    return true
}

module.exports.getRegisteredUser = getRegisteredUser
module.exports.getUserPhone = getUserPhone
module.exports.setUserType = setUserType