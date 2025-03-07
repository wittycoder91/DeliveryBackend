const express = require("express");
const delivery = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const deliveryCtrl = require("../../controllers/deliveryCtrl");
const { getUserIdFromToken } = require("../../config/common");

// Delivery Management
delivery.post("/admin/set-read-delivery", async (req, res) => {
  try {
    res.send(await deliveryCtrl.setReadDelivery());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set upload directories based on fieldname
    const uploadDir =
      file.fieldname === "sds" ? "uploads/sds" : "uploads/images/delivery";
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Set filename to timestamp to avoid collisions
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extname = path.extname(file.originalname); // Get the file extension
    const filename = `${file.fieldname}-${uniqueSuffix}${extname}`; // Add the fieldname to ensure uniqueness

    cb(null, filename);
  },
});
const upload = multer({ storage: storage });
// Set up the upload fields (multiple images and 1 SDS)
const uploadFields = upload.fields([
  { name: "images", maxCount: 100 },
  { name: "sds", maxCount: 1 },
]);
// Handle POST request for adding delivery
delivery.post("/user/add-delivery", uploadFields, async (req, res) => {
  try {
    const imageUploadDir = path.resolve(
      __dirname,
      "../uploads/images/delivery"
    );
    const sdsUploadDir = path.resolve(__dirname, "../uploads/sds");

    // Ensure upload directories exist, create if not
    if (!fs.existsSync(imageUploadDir)) {
      fs.mkdirSync(imageUploadDir, { recursive: true });
    }
    if (!fs.existsSync(sdsUploadDir)) {
      fs.mkdirSync(sdsUploadDir, { recursive: true });
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
      sdsUrl,
      uploadSDSStatus,
      other,
      note,
    } = req.body;

    const userId = getUserIdFromToken(req.headers["x-auth-token"]);

    // Determine avatarPaths based on upload status
    // Preserve existing image URLs
    let avatarPaths = [];
    try {
      avatarPaths = imageurl ? JSON.parse(imageurl) : [];
    } catch (e) {
      console.warn("Failed to parse imageurl:", e.message);
    }

    // Append newly uploaded images instead of replacing
    if (uploadstatus === "true" && req.files.images) {
      const newImages = req.files.images.map((file) => file.path);
      avatarPaths = [...avatarPaths, ...newImages];
    }

    let sdsPath = sdsUrl;
    if (uploadSDSStatus === "true" && req.files && req.files.sds) {
      sdsPath = req.files.sds[0].path;
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
      other,
      note,
      avatarPaths,
      sdsPath
    );

    // Respond with the result
    res.send(result);
  } catch (e) {
    // Handle errors
    console.error("Error during file upload:", e.message);
    res
      .status(500)
      .json({ success: false, message: `API error: ${e.message}` });
  }
});

delivery.get("/user/lastest-delivery", async (req, res) => {
  try {
    const userId = getUserIdFromToken(req.headers["x-auth-token"]);

    res.send(await deliveryCtrl.getLastestDelivery(userId));
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
    const { selDeliveryId, status, price } = req.body;

    res.send(
      await deliveryCtrl.updateSelDelivery(selDeliveryId, status, price)
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
const storageFeedback = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images/feedback/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const uploadFeedback = multer({ storage: storageFeedback });
delivery.post(
  "/admin/add-feedback-delivery",
  uploadFeedback.array("images"),
  async (req, res) => {
    try {
      // Check if files are uploaded
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No files uploaded" });
      }

      // Ensure the upload directory exists
      const uploadDir = path.resolve(__dirname, "../uploads/images/feedback");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Extract fields from the request body
      const {
        selID,
        status,
        totalamount,
        tareamount,
        quality,
        pkgscount,
        package,
        insepction,
        feedback,
      } = req.body;

      // let feedbackImage = req.file.path;
      const uploadedFilePaths = req.files.map((file) => file.path);

      const result = await deliveryCtrl.addDeliveryFeedback(
        selID,
        status,
        totalamount,
        tareamount,
        quality,
        pkgscount,
        package,
        insepction,
        feedback,
        uploadedFilePaths
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
const storageReject = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images/reject/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const uploadReject = multer({ storage: storageReject });
delivery.post(
  "/admin/add-reject-delivery",
  uploadReject.array("images"),
  async (req, res) => {
    try {
      const rejectUploadDir = path.resolve(
        __dirname,
        "../uploads/images/reject/"
      );
      if (!fs.existsSync(rejectUploadDir)) {
        fs.mkdirSync(rejectUploadDir, { recursive: true });
      }

      // Check if files are uploaded
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No files uploaded" });
      }

      const { reason, selID } = req.body;
      const uploadedFilePaths = req.files.map((file) => file.path);

      const result = await deliveryCtrl.addRejectDelivery(
        selID,
        reason,
        uploadedFilePaths
      );

      res.send(result);
    } catch (e) {
      console.error(e);
      res
        .status(500)
        .json({ success: false, message: `API error: ${e.message}` });
    }
  }
);

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
