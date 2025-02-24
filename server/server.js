const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require('path');
const bodyParser = require('body-parser');
const cron = require("node-cron");
const Mailing = require("./models/sending.model");
require("dotenv").config();
const app = express();
const { Op } = require('sequelize');
const {sendUserMessages} = require("./bot");

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