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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir =
      file.fieldname === "w9" ? "uploads/w9" : "uploads/images/users";
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "w9", maxCount: 1 },
]);
auth.post("/user/register", uploadFields, async (req, res) => {
  try {
    const imageUploadDir = path.resolve(__dirname, "../uploads/images/users");
    const w9UploadDir = path.resolve(__dirname, "../uploads/w9");
    if (!fs.existsSync(imageUploadDir)) {
      fs.mkdirSync(imageUploadDir, { recursive: true });
    }
    if (!fs.existsSync(w9UploadDir)) {
      fs.mkdirSync(w9UploadDir, { recursive: true });
    }

    const {
      name,
      email,
      password,
      address,
      city,
      state,
      zipcode,
      phonenumber,
      industry,
    } = req.body;
    const avatarPath = req.files.image ? req.files.image[0].path : null;
    const w9Path = req.files.w9 ? req.files.w9[0].path : null;

    res.send(
      await authCtrl.register(
        name,
        email,
        password,
        address,
        city,
        state,
        zipcode,
        phonenumber,
        industry,
        avatarPath,
        w9Path
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
