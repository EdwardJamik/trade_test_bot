const User = require("../models/user.model");

async function getLastMessage(chat_id) {

    const {last_message} = await User.findOne({chat_id},{last_message: true})
    return last_message
}

async function getLastTwoMessage(chat_id) {
    const {last_two_message} = await User.findOne({chat_id},{last_two_message: true})
    return last_two_message
}

module.exports.getLastMessage = getLastMessage
module.exports.getLastTwoMessage = getLastTwoMessage