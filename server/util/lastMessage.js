const User = require("../models/user.model");

async function getLastMessage(chat_id) {
    const {last_message} = await User.findOne({chat_id},{last_message: true})
    return last_message
}

module.exports.getLastMessage = getLastMessage