const express = require("express");
const apiRouter = express.Router();
const authMiddelware = require("../middlewares/auth");

const publicRoutes = require("./publicRoutes");
const privateRoutes = require("./privateRoutes");

apiRouter.use("/", publicRoutes);
apiRouter.use("/", [authMiddelware], privateRoutes);

module.exports = apiRouter;
