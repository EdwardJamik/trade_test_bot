const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require('path');
const bodyParser = require('body-parser');
const cron = require("node-cron");
const User = require("./models/user.model");
const Mailing = require("./models/sending.model");
const UserProgress = require("./models/progress.model");
require("dotenv").config();
const app = express();
const { Op } = require('sequelize');
const {sendUserMessages,sendUserReminderMessages} = require("./bot");

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

//middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());

app.use(cors({
    origin: true,
    credentials: true,
}));

cron.schedule('*/15 * * * * *', async () => {
    const currentDate = new Date();

    const twoMinutesAgo = new Date(currentDate);
    twoMinutesAgo.setMinutes(currentDate.getMinutes() - 2);

    const findMailing = await Mailing.findOne({
        date: {
            $lte: currentDate,
        },
        start_send:false
    });

    if (findMailing) {
        sendUserMessages(findMailing?._id)
    }
});


cron.schedule('* * * * *', async () => {

    const currentDate = new Date();

    const oneHourAgo = new Date(currentDate);
    oneHourAgo.setHours(currentDate.getHours() - 1);

    const twentyFourHoursAgo = new Date(currentDate);
    twentyFourHoursAgo.setHours(currentDate.getHours() - 24);

    const findProgress1h = await UserProgress.distinct('chat_id', {
        updatedAt: {
            $lte: oneHourAgo,
            $gt: twentyFourHoursAgo
        },
        test: false,
        remind_1h: false
    });

    const findProgress24h = await UserProgress.distinct('chat_id', {
        updatedAt: {
            $lte: twentyFourHoursAgo
        },
        test: false,
        remind_24h: false
    });

    if(findProgress1h?.length) {
        await UserProgress.updateMany(
            { chat_id: { $in: findProgress1h } },
            { $set: { remind_1h: true } }
        );
        await sendUserReminderMessages(findProgress1h)
    }

    if (findProgress24h?.length) {
        await UserProgress.updateMany(
            { chat_id: { $in: findProgress24h } },
            { $set: { remind_24h: true } }
        );
        await sendUserReminderMessages(findProgress24h);
    }
});


const supportFolder = path.join(__dirname, 'uploads/module');
const supportFolderTest = path.join(__dirname, 'uploads/testing');
const supportFoldeMailing = path.join(__dirname, 'uploads/mailing');
const supportFoldePractical = path.join(__dirname, 'uploads/practical');

app.use('/uploads/module', express.static(supportFolder));
app.use('/uploads/testing', express.static(supportFolderTest));
app.use('/uploads/mailing', express.static(supportFoldeMailing));
app.use('/uploads/practical', express.static(supportFoldePractical));

app.use("/api/v1/admin", require("./services/admin.router.js"));
app.use("/api/v1/module", require("./services/module.router"));
app.use("/api/v1/filling", require("./services/filling.router"));
app.use("/api/v1/testing", require("./services/testing.router.js"));
app.use("/api/v1/practical", require("./services/practical.router.js"));
app.use("/api/v1/gallery", require("./services/gallery.router.js"));
app.use("/api/v1/users", require("./services/users.router.js"));
app.use("/api/v1/mailing", require("./services/mailing.router.js"));
app.use("/api/v1/upload", require("./services/upload.router.js"));
app.use("*", (req, res) => res.status(404).json({ error: "not found"}));



module.exports = app;