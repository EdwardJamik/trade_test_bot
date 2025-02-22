const router = require("express").Router();
const multer = require("multer");
const auth = require("../middlewares/auth");
const { v4: uuidv4 } = require('uuid');

const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/video/');
    },
    filename: function (req, file, cb) {
        const randomString = uuidv4();
        const fileExtension = file.originalname.split('.').pop();
        const newFileName = `${randomString}-${Date.now()}.${fileExtension}`;
        cb(null, newFileName);
    },
});

const imageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/image/');
    },
    filename: function (req, file, cb) {
        const randomString = uuidv4();
        const fileExtension = file.originalname.split('.').pop();
        const newFileName = `${randomString}-${Date.now()}.${fileExtension}`;
        cb(null, newFileName);
    },
});


router.post('/video',  multer({ storage: videoStorage }).single('video'), (req, res) => {
    try {
        const fileName = req.file.filename;
        res.json({ message: fileName });
    }catch(e)
    {
        res.status(500).send();
    }
});

router.post('/image',  multer({ storage: imageStorage }).single('image'), (req, res) => {
    try{
        const fileName = req.file.filename;
        res.json({ message: fileName });
    }catch(e){
        res.status(500).send();
    }
});

module.exports = router;