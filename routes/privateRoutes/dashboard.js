const express = require("express");
const dashboard = express.Router();

const dashboardCtrl = require("../../controllers/dashboardCtrl");
const { getUserIdFromToken } = require("../../config/common");

// Material Management
dashboard.get("/user/get-dashboard-loyalty", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req.headers["x-auth-token"]);

    res.send(await dashboardCtrl.getDashboardLoyalty(userId));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
dashboard.get("/user/get-dashboard-widget", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req.headers["x-auth-token"]);

    res.send(await dashboardCtrl.getDashboardWidget(userId));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
dashboard.get("/user/get-dashboard-delivery", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req.headers["x-auth-token"]);

    res.send(await dashboardCtrl.getDashboardDelivery(userId));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
dashboard.get("/user/get-dashboard-weight", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req.headers["x-auth-token"]);

    res.send(await dashboardCtrl.getDashboardWeight(userId));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
dashboard.get("/admin/get-dashboard-widget", async (req, res) => {
  try {
    res.send(await dashboardCtrl.getAdminDashboardWidget());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
dashboard.get("/admin/get-dashboard-delivery", async (req, res) => {
  try {
    res.send(await dashboardCtrl.getAdminDashboardDelivery());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
dashboard.get("/admin/get-dashboard-weight", async (req, res) => {
  try {
    res.send(await dashboardCtrl.getAdminDashboardWeight());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
dashboard.get("/admin/get-dashboard-loyalty", async (req, res) => {
  try {
    res.send(await dashboardCtrl.getAdminDashboardLoyalty());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
module.exports = dashboard;
