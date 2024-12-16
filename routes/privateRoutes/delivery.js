const express = require("express");
const delivery = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const deliveryCtrl = require("../../controllers/deliveryCtrl");
const { getUserIdFromToken } = require("../../config/common");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images/delivery/"); // Make sure the "uploads" folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename
  },
});
const upload = multer({ storage: storage });
// Delivery Management
delivery.post("/admin/set-read-delivery", async (req, res) => {
  try {
    res.send(await deliveryCtrl.setReadDelivery());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
delivery.post(
  "/user/add-delivery",
  upload.single("image"),
  async (req, res) => {
    try {
      // Ensure the upload directory exists
      const uploadDir = path.resolve(__dirname, "../uploads/images/delivery");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Extract fields from the request body
      const {
        material,
        weight,
        packaging,
        countpackage,
        color,
        residue,
        condition,
        date,
        time,
        uploadstatus,
        imageurl,
      } = req.body;

      const userId = getUserIdFromToken(req.headers["x-auth-token"]);
      // Determine avatarPath based on `uploadstatus`
      let avatarPath = imageurl;
      if (uploadstatus === "true") {
        // If uploadstatus is true, ensure file was uploaded
        if (!req.file) {
          return res
            .status(400)
            .json({ success: false, message: "File upload failed" });
        }
        avatarPath = req.file.path; // Use the uploaded file's path
      }

      // Call the controller to add the delivery
      const result = await deliveryCtrl.addDelivery(
        userId,
        material,
        weight,
        packaging,
        countpackage,
        color,
        residue,
        condition,
        date,
        time,
        avatarPath
      );

      // Respond with the result
      res.send(result);
    } catch (e) {
      res
        .status(500)
        .json({ success: false, message: `API error ${e.message}` });
    }
  }
);
delivery.get("/user/lastest-delivery", async (req, res) => {
  try {
    res.send(await deliveryCtrl.getLastestDelivery());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
delivery.get("/admin/get-delivery", async (req, res) => {
  try {
    const {
      curSupplier,
      curMaterial,
      curPackage,
      curSearh,
      itemsPerPage,
      currentPage,
    } = req.query;

    res.send(
      await deliveryCtrl.getDeliverys(
        curSupplier,
        curMaterial,
        curPackage,
        curSearh,
        itemsPerPage,
        currentPage
      )
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
delivery.get("/admin/get-sel-delivery", async (req, res) => {
  try {
    const { selDeliveryId } = req.query;

    res.send(await deliveryCtrl.getSelDelivery(selDeliveryId));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
delivery.post("/admin/update-sel-delivery", async (req, res) => {
  try {
    const { selDeliveryId, status } = req.body;

    res.send(await deliveryCtrl.updateSelDelivery(selDeliveryId, status));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
delivery.post("/admin/add-feedback-delivery", async (req, res) => {
  try {
    const { selID, curStatus, curDeliveryAmount, curDeliveryFeedback } =
      req.body;

    res.send(
      await deliveryCtrl.addDeliveryFeedback(
        selID,
        curStatus,
        curDeliveryAmount,
        curDeliveryFeedback
      )
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
delivery.get("/user/get-delivery", async (req, res) => {
  try {
    const { curMaterial, curPackage, curSearh } = req.query;
    const userId = getUserIdFromToken(req.headers["x-auth-token"]);

    res.send(
      await deliveryCtrl.getUserDeliverys(
        userId,
        curMaterial,
        curPackage,
        curSearh
      )
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
delivery.post("/user/update-sel-delivery", async (req, res) => {
  try {
    const { selDeliveryId, updateDate, updateTime } = req.body;

    res.send(
      await deliveryCtrl.updateUserSelDelivery(
        selDeliveryId,
        updateDate,
        updateTime
      )
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
// DeliveryLogs Management
delivery.get("/admin/get-all-deliverylogs", async (req, res) => {
  try {
    const {
      curSupplier,
      curMaterial,
      curPackage,
      curSearh,
      itemsPerPage,
      currentPage,
    } = req.query;

    res.send(
      await deliveryCtrl.getDeliveryLogs(
        curSupplier,
        curMaterial,
        curPackage,
        curSearh,
        itemsPerPage,
        currentPage
      )
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
delivery.get("/admin/get-sel-deliverylog", async (req, res) => {
  try {
    const { selDeliveryId } = req.query;

    res.send(await deliveryCtrl.getSelDeliveryLog(selDeliveryId));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
delivery.get("/user/get-all-deliverylogs", async (req, res) => {
  const userId = getUserIdFromToken(req.headers["x-auth-token"]);

  try {
    const { curMaterial, curPackage, curSearh, itemsPerPage, currentPage } =
      req.query;

    res.send(
      await deliveryCtrl.getUserDeliveryLogs(
        userId,
        curMaterial,
        curPackage,
        curSearh,
        itemsPerPage,
        currentPage
      )
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
delivery.get("/user/get-sel-deliverylog", async (req, res) => {
  try {
    const { selDeliveryId } = req.query;

    res.send(await deliveryCtrl.getUserSelDeliveryLog(selDeliveryId));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

module.exports = delivery;
