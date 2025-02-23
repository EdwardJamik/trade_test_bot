const multer = require("multer");
const router = require("express").Router();
const uuid = require("uuid");
const path = require('path');
const Testing = require("../models/testing.model");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/testing';
        // Створюємо директорію якщо її немає
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuid.v4()}${ext}`);
    }
});

const upload = multer({ storage });

router.post("/create", upload.any(), async (req, res) => {
    try {
        const { title } = req.body;
        const files = req.files || [];

        // Збираємо всі питання з formData
        const questions = Object.keys(req.body)
            .filter(key => key.startsWith('question_') && !key.includes('photo'))
            .map(key => {
                const questionData = JSON.parse(req.body[key]);
                const questionId = questionData.id;

                // Шукаємо відповідний файл для цього питання
                const photoFile = files.find(file => file.fieldname === `question_photo_${questionId}`);

                return {
                    ...questionData,
                    photo: photoFile ? photoFile.filename : null
                };
            });

        // Створюємо тест в базі даних
        const test = await Testing.create({
            title,
            questions
        });

        res.json({
            success: true,
            id: test._id,
            message: 'Тест успішно створено'
        });

    } catch (error) {
        // Видаляємо завантажені файли у випадку помилки
        if (req.files) {
            req.files.forEach(file => {
                safeDeleteFile(file.filename);
            });
        }

        console.error('Error creating test:', error);
        res.status(500).json({
            success: false,
            message: 'Помилка при створенні тесту',
            error: error.message
        });
    }
});

const safeDeleteFile = (filename) => {
    if (!filename) return;

    const filePath = path.join('./uploads/testing', filename);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error(`Помилка видалення файлу ${filename}:`, error);
        }
    }
};

router.get("/all", async (req, res) => {
    try {
        const tests = await Testing.find();

        if (!tests) {
            return res.status(404).json({ success: false, message: "Тестів не знайдено" });
        }
        res.json({ success: true, tests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

router.post("/update/:id", upload.any(), async (req, res) => {
    try {
        const testId = req.params.id;
        const { title } = req.body;
        const files = req.files || [];

        const currentTest = await Testing.findById(testId);
        if (!currentTest) {
            return res.status(404).json({ success: false, message: "Тест не знайдено" });
        }

        const questions = Object.keys(req.body)
            .filter(key => key.startsWith('question_') && !key.includes('photo'))
            .map(key => {
                const questionData = JSON.parse(req.body[key]);
                const questionId = questionData.id;
                const keepPhoto = questionData.keepPhoto;

                // Шукаємо новий файл для цього питання
                const photoFile = files.find(file => file.fieldname === `question_photo_${questionId}`);

                // Шукаємо відповідне старе питання
                const oldQuestion = currentTest.questions.find(q => q.id === questionId);

                let photoFilename = null;

                if (photoFile) {
                    // Якщо є новий файл
                    photoFilename = photoFile.filename;
                    if (oldQuestion?.photo) {
                        safeDeleteFile(oldQuestion.photo);
                    }
                } else if (keepPhoto && oldQuestion?.photo) {
                    // Якщо треба зберегти старе фото
                    photoFilename = oldQuestion.photo;
                } else if (oldQuestion?.photo) {
                    // Якщо фото було видалено
                    safeDeleteFile(oldQuestion.photo);
                }

                return {
                    ...questionData,
                    photo: photoFilename,
                    keepPhoto: undefined // Видаляємо технічне поле
                };
            });

        const updatedTest = await Testing.findByIdAndUpdate(
            testId,
            {
                title,
                questions
            },
            { new: true }
        );

        res.json({
            success: true,
            id: updatedTest._id
        });

    } catch (error) {
        if (req.files) {
            req.files.forEach(file => {
                safeDeleteFile(file.filename);
            });
        }
        console.error("Помилка оновлення:", error);
        res.status(500).json({ success: false, message: "Помилка при оновленні тесту" });
    }
});

router.post("/remove/:id", async (req, res) => {
    try {
        const testId = req.params.id;

        // Отримуємо тест
        const currentTest = await Testing.findById(testId);
        if (!currentTest) {
            return res.status(404).json({ success: false, message: "Тест не знайдено" });
        }

        // Видаляємо всі фото з питань
        currentTest.questions.forEach(question => {
            if (question.photo) {
                safeDeleteFile(question.photo);
            }
        });

        // Видаляємо сам тест
        await Testing.deleteOne({ _id: testId });

        // Отримуємо оновлений список тестів
        const newListTests = await Testing.find();

        res.json({
            success: true,
            tests: newListTests
        });

    } catch (error) {
        console.error("Помилка видалення:", error);
        res.status(500).json({ success: false, message: "Помилка при видаленні тесту" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const module = await Testing.findById(req.params.id);
        if (!module) {
            return res.status(404).json({ success: false, message: "Модуль не знайдено" });
        }
        res.json({ success: true, module });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

module.exports = router;