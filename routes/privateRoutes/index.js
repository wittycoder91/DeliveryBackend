const express = require("express");
const privateRouter = express.Router();

const setting = require("./setting.js");
const user = require("./user.js");
const delivery = require("./delivery.js");
const dashboard = require("./dashboard.js");

privateRouter.use("/setting", setting);
privateRouter.use("/user", user);
privateRouter.use("/delivery", delivery);
privateRouter.use("/dashboard", dashboard);

module.exports = privateRouter;
