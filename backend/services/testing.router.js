const router = require("express").Router();

router.get("/create", async (req, res) => {
    try {

        // await checkSeminar(false)

        res.send(true)
    } catch (err) {
        res.json(false);
    }
});

module.exports = router;


// [
//     {
//         question:'1',
//         question_img:'url/url',
//         answer: ['dsgsdg 1','dsgsdg 2','dsgsdg 3','dsgsdg 4']
//     }
// ]
