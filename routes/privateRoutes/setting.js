const express = require("express");
const setting = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const settingCtrl = require("../../controllers/settingCtrl");
const { getUserIdFromToken } = require("../../config/common");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images/users/"); // Make sure the "uploads" folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename
  },
});
const upload = multer({ storage: storage });

// User Management
setting.get("/admin/get-allusers", async (req, res) => {
  try {
    res.send(await settingCtrl.getAllUsers());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.get("/user/get-user-information", async (req, res) => {
  const userId = getUserIdFromToken(req.headers["x-auth-token"]);

  try {
    res.send(await settingCtrl.getSelUserInformation(userId));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post(
  "/user/update-user-information",
  upload.single("image"),
  async (req, res) => {
    try {
      // Ensure the upload directory exists
      const uploadDir = path.resolve(__dirname, "../uploads/images/users");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Extract fields from the request body
      const {
        name,
        email,
        password,
        newpassword,
        address,
        city,
        state,
        zipcode,
        imageurl,
        uploadstatus,
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
      const result = await settingCtrl.UpdateUserInformation(
        userId,
        name,
        email,
        password,
        newpassword,
        address,
        city,
        state,
        zipcode,
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

// Package Management
setting.get("/admin/get-allpackages", async (req, res) => {
  try {
    res.send(await settingCtrl.getAllPackages());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// Quality Management
setting.get("/admin/get-qualitys", async (req, res) => {
  try {
    res.send(await settingCtrl.getAllQualitys());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// Material Management
setting.get("/admin/get-allmaterials", async (req, res) => {
  try {
    res.send(await settingCtrl.getAllMaterials());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.get("/admin/get-materials", async (req, res) => {
  try {
    const { curSearh, itemsPerPage, currentPage } = req.query;

    res.send(
      await settingCtrl.getMaterials(curSearh, itemsPerPage, currentPage)
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/add-material", async (req, res) => {
  try {
    const { materialName, materialDesc, note } = req.body;

    res.send(await settingCtrl.addMaterial(materialName, materialDesc, note));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/edit-material", async (req, res) => {
  try {
    const { selID, materialName, materialDesc, note } = req.body;

    res.send(
      await settingCtrl.editMaterial(selID, materialName, materialDesc, note)
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/remove-material", async (req, res) => {
  try {
    const { selID } = req.body;

    res.send(await settingCtrl.delMaterial(selID));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// Setting Management
setting.get("/admin/get-setting", async (req, res) => {
  try {
    res.send(await settingCtrl.getSettings());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/update-setting", async (req, res) => {
  try {
    const {
      curFirstTime,
      curSecondTime,
      curThirdTime,
      curFourthTime,
      curGolden,
      curSilver,
      curBronze,
      curAddress,
      curCity,
      curState,
      curZipcode,
      curTel,
    } = req.body;

    res.send(
      await settingCtrl.updateSetting(
        curFirstTime,
        curSecondTime,
        curThirdTime,
        curFourthTime,
        curGolden,
        curSilver,
        curBronze,
        curAddress,
        curCity,
        curState,
        curZipcode,
        curTel
      )
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// FAG Management
setting.get("/admin/get-faq", async (req, res) => {
  try {
    const { itemsPerPage, currentPage } = req.query;

    res.send(await settingCtrl.getFAQs(itemsPerPage, currentPage));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/add-faq", async (req, res) => {
  try {
    const { curTitle, curContent } = req.body;

    res.send(await settingCtrl.addFAQ(curTitle, curContent));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/edit-faq", async (req, res) => {
  try {
    const { selID, curTitle, curContent } = req.body;

    res.send(await settingCtrl.editFAQ(selID, curTitle, curContent));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/remove-faq", async (req, res) => {
  try {
    const { selID } = req.body;

    res.send(await settingCtrl.delFAQ(selID));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// Supplier Management
setting.get("/admin/get-supplier", async (req, res) => {
  try {
    const { curSearh, itemsPerPage, currentPage } = req.query;

    res.send(
      await settingCtrl.getSupplier(curSearh, itemsPerPage, currentPage)
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/edit-supplier", async (req, res) => {
  try {
    const { selID, trust } = req.body;

    res.send(await settingCtrl.editSupplier(selID, trust));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/remove-supplier", async (req, res) => {
  try {
    const { selID } = req.body;

    res.send(await settingCtrl.delSupplier(selID));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

module.exports = setting;
