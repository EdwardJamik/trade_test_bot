const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model.js");
// const Answer = require("../models/answers.model");
// const RequestPersonal = require("../models/personalSelection.model")
const TelegramUsers = require("../models/user.model")
// const Seminar = require("../models/seminars.model")
// const RegisteredSeminar = require("../models/seminars_users")
// const Discount = require("../models/discount.model")
// const Novelty = require("../models/novelty.model")
// const SeminarImage = require("../models/seminarsImage.model")
// const Notification = require("../models/notification.model")
// const viberSettings = require("../models/viberSetting.model")
const Sending = require("../models/sending.model")
// const Referal = require("../models/referal.model")
const Support = require("../models/support.model")
const SupportUser = require("../models/supportuser.model")
// const SeminarsSetting = require("../models/settingSeminar.model")
// const sendingUsers  = require('../bot/index');
// const sendEditGroupRequest  = require('../bot/index');
// const {sendingUsersViber}  = require('../bot/indexViber');
const auth = require("../middlewares/auth");
const dayjs = require("dayjs");
const fs = require("fs");
const cron = require("node-cron");
// const {checkSeminar,checkBanner} = require("../apiUpdated");
const {v4: uuidv4} = require("uuid");
const {createSecretToken} = require("../util/SecretToken");
const path = require("path");
const { JWT_SECRET } = process.env

router.post("/",  async (req, res) => {
    try {

        const token = req.cookies.token

        if (!token) {
            return res.json({ status: false })
        }
        jwt.verify(token, JWT_SECRET, async (err, data) => {
            if (err) {
                return res.json({ status: false })
            } else {
                const user = await Admin.findById(data.id)
                if (user) return res.json({ status: true, user: user.email, root: user.root })
                else return res.json({ status: false })
            }
        })
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.post("/register", async (req, res) => {
    try {
        const { email, password, roots } = req.body;

        if (!email || !password || !roots.length)
            return res.json({ confirm:false,errorMessage: "Будь ласка заповніть всі поля" });
        if (password.length < 6)
            return res.json({ confirm:false,errorMessage: "Пароль користувача повинен містити 6 або більше символів" });

        const emailRegex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
        if(!emailRegex.test(email)) return res.json({ confirm:false,errorMessage: "Не вірно введено email нового користувача" });

        const existingAdmin = await Admin.findOne({ email: email });

        if (existingAdmin)
            return res.json({ confirm:false,errorMessage: "Користувач існує" });

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const root = [!!roots.includes('0'),!!roots.includes('1'),!!roots.includes('2'),!!roots.includes('3'),!!roots.includes('4'),!!roots.includes('5'),!!roots.includes('6'),!!roots.includes('7'),!!roots.includes('8'),!!roots.includes('9')]

        const newAdmin = new Admin({
            email: email,
            passwordHash: passwordHash,
            entree: root
        });

        const savedAdmin = await newAdmin.save();

        res.json({confirm:true});
    } catch (e) {
        res.status(500).send();
    }
})

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.json({ errorMessage: "Заповніть всі поля" });

        const existingAdmin = await Admin.findOne({ email: email});

        if (!existingAdmin)
            return res.json({ errorMessage: "Невірний email або password" });

        const isPasswordValid = await bcrypt.compare(password, existingAdmin?.passwordHash);

        if (!isPasswordValid)
            return res.json({ errorMessage: "Невірний email або password" });

        const token = createSecretToken(existingAdmin._id);

        res.cookie("token", token, {
            httpOnly: false
        }).status(201).json({ message: "Успішно авторизовано", success: true });
    } catch (e) {
        console.log(e)
        res.status(500).send();
    }
});

router.get("/userList",  async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.json(false);

        const adminlog = jwt.verify(token, JWT_SECRET);

        const admin = await Admin.find({_id: { $ne: adminlog.id }});
        res.json(admin);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.post("/deleteUser",  async (req, res) => {
    try {
        const { id } = req.body;
        const token = req.cookies.token;
        if (!token) return res.json({entree:false});

        const adminlog = jwt.verify(token, JWT_SECRET);
        const adminDelete = await Admin.deleteOne({_id: { $ne: adminlog.id }, _id:id});
        res.json(true);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.post("/logout", (req, res) => {
    try {
        res.clearCookie('token')
        res.status(201).json({ message: "User logged in successfully", success: true });
    }catch(e){
        res.status(500).send();
    }
});

router.get("/loggedIn", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.json({entree:false});

        jwt.verify(token, JWT_SECRET);
        const adminlog = jwt.verify(token, JWT_SECRET);

        const admin = await Admin.findOne({_id: adminlog.id},{entree:1,_id:0,root:1});

        res.send({adminInfo:admin.entree,entree:true,root:admin.root})
    } catch (err) {
        res.json(false);
    }
});

router.get("/updatedSeminars", async (req, res) => {
    try {

        await checkSeminar(false)

        res.send(true)
    } catch (err) {
        res.json(false);
    }
});

router.get("/updatedBanner", async (req, res) => {
    try {

        await checkBanner()

        res.send(true)
    } catch (err) {
        res.json(false);
    }
});

router.get("/rootMenu", async (req, res) => {
    try {

        const token = req.cookies.token;
        if (!token) return res.json(false);

        jwt.verify(token, JWT_SECRET);
        const adminlog = jwt.verify(token, JWT_SECRET);

        const admin = await Admin.findOne({_id: adminlog.id},{entree:1,_id:0,root:1});

        res.send(admin)
    } catch (err) {
        res.json(false);
    }
});

router.get("/filling",  async (req, res) => {
    try {
        const fillingAll = await Answer.find({answerText: { $exists: true }},{_id:1,answerText:1, url:1});

        const filling = fillingAll.map((user) => {
            const localizedDateCreatedAt = dayjs(user.createdAt).locale('uk').format('DD.MM.YYYY HH:mm');
            const localizedDateUpdateAt = dayjs(user.updatedAt).locale('uk').format('DD.MM.YYYY HH:mm');
            return {
                ...user._doc,
                createdAt: localizedDateCreatedAt,
                updatedAt: localizedDateUpdateAt
            };
        });

        res.json(filling);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

router.get("/personalRequest",  async (req, res) => {
    try {
        const request = await RequestPersonal.find({processed_accept:false}).sort({createdAt:-1});

        const requestAll = await Promise.all(request.map(async (user) => {
            const localizedDateCreatedAt = dayjs(user.createdAt).locale('uk').format('DD.MM.YYYY HH:mm');
            const localizedDateUpdateAt = dayjs(user.updatedAt).locale('uk').format('DD.MM.YYYY HH:mm');

            const telegramUser = await TelegramUsers.findOne({ chat_id: user.chat_id });

            const userName = telegramUser ? telegramUser.userFirstName : 'Unknown';
            const userCity = telegramUser ? telegramUser.userCity : 'Unknown';

            return {
                ...user._doc,
                userFirstName: userName,
                userCity: userCity,
                createdAt: localizedDateCreatedAt,
                updatedAt: localizedDateUpdateAt
            };
        }));

        res.json(requestAll);
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
});

module.exports = router;