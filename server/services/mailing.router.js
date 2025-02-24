const multer = require("multer");
const router = require("express").Router();
const uuid = require("uuid");
const path = require('path');
const Mailing = require("../models/sending.model");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/mailing');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuid.v4()}${ext}`);
    }
});

const upload = multer({ storage });

const safeDeleteFile = (filename) => {
    if (!filename) return;

    const filePath = path.join('./uploads/mailing', filename);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error(`Помилка видалення файлу ${filename}:`, error);
        }
    }
};

router.post("/create", upload.fields([
    { name: "photo", maxCount: 1 }
]), async (req, res) => {
    if (!req.files) {
        return res.status(400).json({error: "Файл не завантажено"});
    }

    const {title, date, message} = req.body;

    const photo = req.files["photo"] ? req.files["photo"].map(file => `${file.filename}`) : []

    const createMailing = await Mailing.create({title, date, message, file: photo[0] })

    const response = {
        success: true,
        id: createMailing?._id
    };

    res.json(response);
});

router.get("/all", async (req, res) => {
    try {
        const mailing = await Mailing.find().sort({ createdAt: -1 });

        if (!mailing) {
            return res.status(404).json({ success: false, message: "Розсилку не знайдено" });
        }
        res.json({ success: true, mailing });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

router.post("/remove/:id", async (req, res) => {
    try {
        const currentMailing = await Mailing.findById(req.params.id);
        if (!currentMailing) {
            return res.status(404).json({ success: false, message: "Розсилку не знайдено" });
        }

        safeDeleteFile(currentMailing.file);

        await Mailing.deleteOne({_id: req.params.id});

        const newListMailing = await Mailing.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            mailing: newListMailing
        });

    } catch (error) {
        console.error("Помилка оновлення:", error);
        res.status(500).json({ success: false, message: "Помилка при видаленні розсилки" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const mailing = await Mailing.findById(req.params.id);
        if (!mailing) {
            return res.status(404).json({ success: false, message: "Розсилку не знайдено" });
        }
        res.json({ success: true, mailing });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

module.exports = router;