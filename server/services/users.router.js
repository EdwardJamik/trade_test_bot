const router = require("express").Router();
const Users = require("../models/user.model");

router.get("/all", async (req, res) => {
    try {
        const users = await Users.find();

        if (!users) {
            return res.status(404).json({ success: false, message: "Користувачів не знайдено" });
        }
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

router.get("/leader", async (req, res) => {
    try {
        const users = await Users.find().sort({ points: -1 });

        if (!users) {
            return res.status(404).json({ success: false, message: "Користувачів не знайдено" });
        }
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

router.post("/ban", async (req, res) => {
    try {
        const {ban,chat_id}  = req.body;

        const currentUser = await Users.findOne({chat_id: chat_id});
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "Користувача не знайдено" });
        }

        await Users.updateOne({chat_id: chat_id}, {ban:ban});
        const newListGallery = await Users.find();

        res.json({
            success: true,
            users: newListGallery
        });

    } catch (error) {
        console.error("Помилка оновлення:", error);
        res.status(500).json({ success: false, message: "Помилка при оновленні користувача" });
    }
});

module.exports = router;