const multer = require("multer");
const router = require("express").Router();
const uuid = require("uuid");
const path = require('path');
const Practical = require("../models/practical.model");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/practical');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuid.v4()}${ext}`);
    }
});

const upload = multer({ storage });

const safeDeleteFile = (filename) => {
    if (!filename) return;

    const filePath = path.join('./uploads/practical', filename);
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
        return res.status(400).json({error: "Файли не завантажено"});
    }

    const {title, message} = req.body;

    const photo = req.files["photo"] ? req.files["photo"].map(file => `${file.filename}`) : []

    const createPractical = await Practical.create({title, message, photo: photo[0] })

    const response = {
        success: true,
        id: createPractical?._id
    };

    res.json(response);
});

router.get("/all", async (req, res) => {
    try {
        const practical = await Practical.find();

        if (!practical) {
            return res.status(404).json({ success: false, message: "Практичне завдання не знайдено" });
        }
        res.json({ success: true, practical });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

router.post("/update/:id", upload.fields([
    { name: "photo", maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, date, message, test_id, task_id, existing_photo, existing_files } = req.body;

        const currentPractical = await Practical.findById(req.params.id);
        if (!currentPractical) {
            return res.status(404).json({ success: false, message: "Практичне завдання не знайдено" });
        }

        let photo = null;
        if (req.files["photo"]) {
            photo = req.files["photo"][0].filename;
            if (currentPractical.photo) {
                safeDeleteFile(currentPractical.photo);
            }
        } else if (existing_photo) {
            photo = existing_photo;
        } else if (currentPractical.photo) {
            safeDeleteFile(currentPractical.photo);
        }

        const updatedPractical = await Practical.findByIdAndUpdate(
            req.params.id,
            {
                title,
                message,
                photo,
            },
            { new: true }
        );

        res.json({
            success: true,
            id: updatedPractical._id
        });

    } catch (error) {
        console.error("Помилка оновлення:", error);
        res.status(500).json({ success: false, message: "Помилка при оновленні практичного завдання" });
    }
});

router.post("/remove/:id", async (req, res) => {
    try {

        const currentPractical = await Practical.findById(req.params.id);
        if (!currentPractical) {
            return res.status(404).json({ success: false, message: "Практичне завдання не знайдено" });
        }

        safeDeleteFile(currentPractical.photo);

        await Practical.deleteOne({_id:req.params.id});

        const newListPractical = await Practical.find();
        res.json({
            success: true,
            practical: newListPractical
        });

    } catch (error) {
        console.error("Помилка оновлення:", error);
        res.status(500).json({ success: false, message: "Помилка при оновленні практичного завдання" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const practical = await Practical.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ success: false, message: "Практичне завдання не знайдено" });
        }
        res.json({ success: true, practical });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

module.exports = router;