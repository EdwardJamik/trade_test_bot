const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require('path');
const Sending = require("./models/sending.model");
const fs = require("fs");
const bodyParser = require('body-parser');
require("dotenv").config();
const app = express();

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

const supportFolder = path.join(__dirname, 'uploads/module');
const supportFolderTest = path.join(__dirname, 'uploads/testing');

app.use('/uploads/module', express.static(supportFolder));
app.use('/uploads/testing', express.static(supportFolderTest));



app.use("/api/v1/admin", require("./services/admin.router.js"));
app.use("/api/v1/module", require("./services/module.router"));
app.use("/api/v1/filling", require("./services/filling.router"));
app.use("/api/v1/testing", require("./services/testing.router.js"));
app.use("/api/v1/upload", require("./services/upload.router.js"));
app.use("*", (req, res) => res.status(404).json({ error: "not found"}));



module.exports = app;