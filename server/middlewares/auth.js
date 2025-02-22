const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");
const { JWT_SECRET } = process.env

function auth(req, res, next) {
  try {
    const token = req.cookies.token;


    if (!token) return res.status(401).json({ errorMessage: "Unauthorized" });

    req.adminInfo =   jwt.verify(token, JWT_SECRET, async (err, data) => {
      if (err) {
        return res.json({ status: false })
      } else {
        const user = await Admin.findById(data.id)
        if (user) return res.json({ status: true, user: user.email, root: user.root })
        else return res.json({ status: false })
      }
    })

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ errorMessage: "Unauthorized" });
  }
}

module.exports = auth;