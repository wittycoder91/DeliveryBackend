const fs = require("fs");
const path = require("path");
const express = require("express");
const auth = express.Router();
const multer = require("multer");
const authCtrl = require("../../controllers/authCtrl");

// User Login & Register
auth.post("/user/login", async (req, res) => {
  try {
    const data = req.body;
    const email = data.email;
    const password = data.password;
    res.send(await authCtrl.login(email, password));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images/users/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
auth.post("/user/register", upload.single("image"), async (req, res) => {
  try {
    const imageUploadDir = path.resolve(__dirname, "../uploads/images/users");
    if (!fs.existsSync(imageUploadDir)) {
      fs.mkdirSync(imageUploadDir, { recursive: true });
    }

    const {
      name,
      contact,
      email,
      password,
      address,
      city,
      state,
      zipcode,
      phonenumber,
      industry,
    } = req.body;

    let avatarPath = req.file ? req.file.path : "";

    res.send(
      await authCtrl.register(
        name,
        contact,
        email,
        password,
        address,
        city,
        state,
        zipcode,
        phonenumber,
        industry,
        avatarPath
      )
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// Admin Login
auth.post("/admin/login", async (req, res) => {
  try {
    const data = req.body;
    const userId = data.userId;
    const password = data.password;
    res.send(await authCtrl.adminLogin(userId, password));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// Industry Management
auth.get("/admin/get-allindustry", async (req, res) => {
  try {
    res.send(await authCtrl.getAllIndustry());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

module.exports = auth;
