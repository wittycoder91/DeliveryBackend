require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const Mailjet = require("node-mailjet");
const auth = express.Router();
const multer = require("multer");
const authCtrl = require("../../controllers/authCtrl");

if (!process.env.MJ_APIKEY_PUBLIC || !process.env.MJ_APIKEY_PRIVATE) {
  console.error("❌ Mailjet API keys are missing! Check your .env file.");
  process.exit(1);
}

const mailjetClient = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

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

auth.post("/user/forgetpassword", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(200)
        .json({ success: false, message: "Email is required" });
    }

    const updateUser = await authCtrl.forgetPassword(email);
    if (!updateUser.success) {
      return res
        .status(200)
        .json({ success: false, message: updateUser.message });
    }

    // If forgetPassword is successful, send email using Mailjet
    const request = mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: "accounting@archpolymers.com",
            Name: "Archpolymers",
          },
          To: [
            {
              Email: email,
              Name: "",
            },
          ],
          Subject: "Reset Your Password",
          TextPart: "Click the link below to reset your password.",
          HTMLPart: `<h3>Hello,</h3><p>Click <a href="https://customer.archpolymers.com/#/changepassword?email=${encodeURIComponent(
            email
          )}">here</a> to reset your password.</p>`,
        },
      ],
    });

    const result = await request;

    // Check if email was successfully sent
    if (result.body?.Messages?.[0]?.Status === "success") {
      return res
        .status(200)
        .json({
          success: true,
          message: "Email sent successfully, please check your mailbox",
        });
    } else {
      console.error("Mailjet error:", result.body);
      return res
        .status(500)
        .json({ success: false, message: "Failed to send email" });
    }
  } catch (e) {
    console.error("Unexpected Error:", e.message);
    res
      .status(500)
      .json({ success: false, message: `API error: ${e.message}` });
  }
});

auth.post("/user/changepassword", async (req, res) => {
  try {
    const data = req.body;
    const email = data.email;
    const password = data.password;
    res.send(await authCtrl.changePassword(email, password));
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
