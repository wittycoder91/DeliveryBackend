const express = require("express");
const user = express.Router();
const userCtrl = require("../../controllers/userCtrl");

// Manage User
user.get("/get-sel-userinfor", async (req, res) => {
  try {
    const { selEmail } = req.query;

    res.send(await userCtrl.getSelUserInfor(selEmail));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

module.exports = user;
