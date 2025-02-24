const router = require("express").Router();
const Users = require("../models/user.model");
const UserProgress = require("../models/progress.model");

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

        const getUsersWithProgress = async () => {
            try {
                const users = await Users.aggregate([
                    {
                        $lookup: {
                            from: "userprogresses",
                            let: { userId: "$chat_id" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: ["$chat_id", "$$userId"] }
                                    }
                                },
                                {
                                    $sort: { updatedAt: -1 }
                                },
                                {
                                    $limit: 1
                                }
                            ],
                            as: "lastProgress"
                        }
                    },
                    {
                        $unwind: {
                            path: "$lastProgress",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $lookup: {
                            from: "modules",
                            let: { moduleId: { $toObjectId: "$lastProgress.module_id" } },
                            pipeline: [
                                { $match: { $expr: { $eq: ["$_id", "$$moduleId"] } } }
                            ],
                            as: "moduleInfo"
                        }
                    },
                    {
                        $unwind: {
                            path: "$moduleInfo",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            chat_id: 1,
                            name: 1,
                            points: 1,
                            username:1,
                            last_name:1,
                            first_name:1,
                            phone:1,
                            title: "$moduleInfo.title"
                        }
                    },
                    {
                        $sort: { points: -1 }
                    }
                ]);

                return users;
            } catch (error) {
                console.error('Error fetching users with progress:', error);
                throw error;
            }
        };

        const users = await getUsersWithProgress()

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