const router = require("express").Router();
const Gallery = require("../models/gallery.model");

router.get("/all", async (req, res) => {
    try {
        const gallery = await Gallery.find();

        if (!gallery) {
            return res.status(404).json({ success: false, message: "Відео не знайдено" });
        }
        res.json({ success: true, gallery });
    } catch (error) {
        res.status(500).json({ success: false, message: "Помилка сервера" });
    }
});

router.post("/remove/:id", async (req, res) => {
    try {

        const currentGallery = await Gallery.findById(req.params.id);
        if (!currentGallery) {
            return res.status(404).json({ success: false, message: "Відео не знайдено" });
        }

        await currentGallery.deleteOne({_id:req.params.id});

        const newListGallery = await Gallery.find();

        res.json({
            success: true,
            gallery: newListGallery
        });

    } catch (error) {
        console.error("Помилка оновлення:", error);
        res.status(500).json({ success: false, message: "Помилка при оновленні відео" });
    }
});

module.exports = router;