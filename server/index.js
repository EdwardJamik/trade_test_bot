const mongoose = require("mongoose");
const app = require("./server.js");
const {bot} = require('./bot')
const PORT = process.env.PORT || 5000;

console.log("Connecting to DB...")

mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, (err) => {
    if (err) return console.log(err);
    console.log("DB connection Success")
    bot.launch(process.env.TG_TOKEN, () => {
        console.log(`Telegram bot is running on port ${process.env.TG_TOKEN}`);
    })
    app.listen(PORT, () => console.log(`Server running on PORT : ${PORT}`));
});