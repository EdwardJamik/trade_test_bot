const dayjs = require("dayjs");
const Answer = require("../models/filling.model.js");
const router = require("express").Router();

router.get("/all",  async (req, res) => {
    try {
        const fillings = await Answer.find({filling: { $exists: true }});

        const sortedFillings = fillings.sort((a, b) => {
            if (a.type === "button" && b.type !== "button") {
                return 1;
            }
            if (a.type !== "button" && b.type === "button") {
                return -1;
            }
            return 0;
        });

        res.json(sortedFillings);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.post("/update",  async (req, res) => {
    try {

        const  array  = req.body;
        for (let item of array) {
            await Answer.updateOne(
                { _id: item._id },
                { $set: item }
            );
        }

        res.json(true);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});


module.exports = router;
