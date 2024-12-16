const express = require("express");
const publicRouter = express.Router();
const auth = require("./auth.js");

publicRouter.use("/auth", auth);

module.exports = publicRouter;
