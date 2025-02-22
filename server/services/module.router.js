const multer = require("multer");
const router = require("express").Router();
const uuid = require("uuid");
const path = require('path');
const Module = require("../models/module.model");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/module');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuid.v4()}${ext}`);
    }
});

const upload = multer({ storage });

const safeDeleteFile = (filename) => {
    if (!filename) return;

    const filePath = path.join('./uploads/module', filename);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error(`Помилка видалення файлу ${filename}:`, error);
        }
    }
};

router.post("/create", upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "other_file", maxCount: 10 }
]), async (req, res) => {
    if (!req.files) {
        return res.status(400).json({error: "Файли не завантажено"});
    }

    const {title, date, message, test_id, task_id} = req.body;

    const photo = req.files["photo"] ? req.files["photo"].map(file => `${file.filename}`) : []
    const other_files = req.files["other_file"] ? req.files["other_file"].map(file => `${file.filename}`) : []

    const createModule = await Module.create({title, date, message, test_id, task_id, photo: photo[0], other_files })

    const response = {
        success: true,
        id: createModule?._id
    };

    res.json(response);
});

router.get("/all", async (req, res) => {
    try {
        const module = await Module.find();

        if (!module) {
            return res.status(404).json({ success: false, message: "Модуль не знайдено" });
        }
        res.json({ success: true, module });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

router.post("/update/:id", upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "other_file", maxCount: 10 }
]), async (req, res) => {
    try {
        const { title, date, message, test_id, task_id, existing_photo, existing_files } = req.body;

        const currentModule = await Module.findById(req.params.id);
        if (!currentModule) {
            return res.status(404).json({ success: false, message: "Модуль не знайдено" });
        }

        let photo = null;
        if (req.files["photo"]) {
            photo = req.files["photo"][0].filename;
            if (currentModule.photo) {
                safeDeleteFile(currentModule.photo);
            }
        } else if (existing_photo) {
            photo = existing_photo;
        } else if (currentModule.photo) {
            safeDeleteFile(currentModule.photo);
        }

        let other_files = [];

        if (existing_files) {
            try {
                const existingFilesArray = JSON.parse(existing_files);
                other_files = existingFilesArray;
            } catch (e) {
                console.error('Помилка парсингу existing_files:', e);
            }
        }

        if (req.files["other_file"]) {
            const newFiles = req.files["other_file"].map(file => file.filename);
            other_files = other_files.concat(newFiles);
        }

        if (currentModule.other_files) {
            currentModule.other_files.forEach(oldFile => {
                if (!other_files.includes(oldFile)) {
                    safeDeleteFile(oldFile);
                }
            });
        }

        const updatedModule = await Module.findByIdAndUpdate(
            req.params.id,
            {
                title,
                date,
                message,
                test_id,
                task_id,
                photo,
                other_files
            },
            { new: true }
        );

        res.json({
            success: true,
            id: updatedModule._id
        });

    } catch (error) {
        console.error("Помилка оновлення:", error);
        res.status(500).json({ success: false, message: "Помилка при оновленні модуля" });
    }
});

router.post("/remove/:id", async (req, res) => {
    try {

        const currentModule = await Module.findById(req.params.id);
        if (!currentModule) {
            return res.status(404).json({ success: false, message: "Модуль не знайдено" });
        }

        safeDeleteFile(currentModule.photo);

            currentModule.other_files.forEach(oldFile => {
                    safeDeleteFile(oldFile);
            });

        await Module.deleteOne({_id:req.params.id});

        const newListModule = await Module.find();
        res.json({
            success: true,
            module:newListModule
        });

    } catch (error) {
        console.error("Помилка оновлення:", error);
        res.status(500).json({ success: false, message: "Помилка при оновленні модуля" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ success: false, message: "Модуль не знайдено" });
        }
        res.json({ success: true, module });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

module.exports = router;