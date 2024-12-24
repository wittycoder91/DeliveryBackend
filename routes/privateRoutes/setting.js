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
    const uploadDir =
      file.fieldname === "w9" ? "uploads/w9" : "uploads/images/users";
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
// Define the upload fields
const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "w9", maxCount: 1 },
]);

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
  uploadFields,
  async (req, res) => {
    try {
      // Ensure the upload directory exists
      const imageUploadDir = path.resolve(__dirname, "../uploads/images/users");
      const w9UploadDir = path.resolve(__dirname, "../uploads/w9");
      if (!fs.existsSync(imageUploadDir)) {
        fs.mkdirSync(imageUploadDir, { recursive: true });
      }
      if (!fs.existsSync(w9UploadDir)) {
        fs.mkdirSync(w9UploadDir, { recursive: true });
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
        phonenumber,
        contact,
        industry,
        w9url,
        uploadW9Status,
      } = req.body;

      const userId = getUserIdFromToken(req.headers["x-auth-token"]);
      // Determine avatarPath based on `uploadstatus`
      let avatarPath = imageurl;
      if (uploadstatus === "true") {
        if (!req.files) {
          return res
            .status(400)
            .json({ success: false, message: "File upload failed" });
        }
        avatarPath = req.files.image ? req.files.image[0].path : null;
      }
      // Determine w9Path based on `uploadstatus`
      let w9Path = w9url;
      if (uploadW9Status === "true") {
        if (!req.files) {
          return res
            .status(400)
            .json({ success: false, message: "File W9 upload failed" });
        }
        w9Path = req.files.w9 ? req.files.w9[0].path : null;
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
        avatarPath,
        phonenumber,
        contact,
        industry,
        w9Path
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

setting.get("/admin/get-industry", async (req, res) => {
  try {
    const { curSearh, itemsPerPage, currentPage } = req.query;

    res.send(
      await settingCtrl.getIndustry(curSearh, itemsPerPage, currentPage)
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/add-industry", async (req, res) => {
  try {
    const { industryName, industryDesc, note } = req.body;

    res.send(await settingCtrl.addIndustry(industryName, industryDesc, note));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/edit-industry", async (req, res) => {
  try {
    const { selID, industryName, industryDesc, note } = req.body;

    res.send(
      await settingCtrl.editIndustry(selID, industryName, industryDesc, note)
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/remove-industry", async (req, res) => {
  try {
    const { selID } = req.body;

    res.send(await settingCtrl.delIndustry(selID));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// Color Management
setting.get("/admin/get-allcolors", async (req, res) => {
  try {
    res.send(await settingCtrl.getAllColor());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.get("/admin/get-color", async (req, res) => {
  try {
    const { curSearh, itemsPerPage, currentPage } = req.query;

    res.send(await settingCtrl.getColor(curSearh, itemsPerPage, currentPage));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/add-color", async (req, res) => {
  try {
    const { colorName, colorDesc, note } = req.body;

    res.send(await settingCtrl.addColor(colorName, colorDesc, note));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/edit-color", async (req, res) => {
  try {
    const { selID, colorName, colorDesc, note } = req.body;

    res.send(await settingCtrl.editColor(selID, colorName, colorDesc, note));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/remove-color", async (req, res) => {
  try {
    const { selID } = req.body;

    res.send(await settingCtrl.delColor(selID));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// Residue Material Management
setting.get("/admin/get-all-residue-materials", async (req, res) => {
  try {
    res.send(await settingCtrl.getAllResidueMaterials());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.get("/admin/get-residue-material", async (req, res) => {
  try {
    const { curSearh, itemsPerPage, currentPage } = req.query;

    res.send(
      await settingCtrl.getResidueMaterials(curSearh, itemsPerPage, currentPage)
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/add-residue-material", async (req, res) => {
  try {
    const { residueName, residueDesc, note } = req.body;

    res.send(
      await settingCtrl.addResidueMaterials(residueName, residueDesc, note)
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/edit-residue-material", async (req, res) => {
  try {
    const { selID, residueName, residueDesc, note } = req.body;

    res.send(
      await settingCtrl.editResidueMaterials(
        selID,
        residueName,
        residueDesc,
        note
      )
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/remove-residue-material", async (req, res) => {
  try {
    const { selID } = req.body;

    res.send(await settingCtrl.delResidueMaterials(selID));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// Conditions Management
setting.get("/admin/get-all-conditions", async (req, res) => {
  try {
    res.send(await settingCtrl.getAllConditions());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.get("/admin/get-condition", async (req, res) => {
  try {
    const { curSearh, itemsPerPage, currentPage } = req.query;

    res.send(
      await settingCtrl.getConditions(curSearh, itemsPerPage, currentPage)
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/add-condition", async (req, res) => {
  try {
    const { conditionName, conditionDesc, note } = req.body;

    res.send(
      await settingCtrl.addConditions(conditionName, conditionDesc, note)
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/edit-condition", async (req, res) => {
  try {
    const { selID, conditionName, conditionDesc, note } = req.body;

    res.send(
      await settingCtrl.editConditions(
        selID,
        conditionName,
        conditionDesc,
        note
      )
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/remove-condition", async (req, res) => {
  try {
    const { selID } = req.body;

    res.send(await settingCtrl.delConditions(selID));
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
      curGoldenBenefit,
      curSilver,
      curSilverBenefit,
      curBronze,
      curBronzeBenefit,
      curAddress,
      curCity,
      curState,
      curZipcode,
      curTel,
      curPrivacy,
      curReport,
    } = req.body;

    res.send(
      await settingCtrl.updateSetting(
        curFirstTime,
        curSecondTime,
        curThirdTime,
        curFourthTime,
        curGolden,
        curGoldenBenefit,
        curSilver,
        curSilverBenefit,
        curBronze,
        curBronzeBenefit,
        curAddress,
        curCity,
        curState,
        curZipcode,
        curTel,
        curPrivacy,
        curReport
      )
    );
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});

// FAG Management
setting.get("/admin/get-all-faq", async (req, res) => {
  try {
    res.send(await settingCtrl.getAllFAQs());
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
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
setting.post("/admin/get-price-supplier", async (req, res) => {
  try {
    const { selID } = req.body;

    res.send(await settingCtrl.getSelUserInformation(selID));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
setting.post("/admin/set-price-supplier", async (req, res) => {
  try {
    const { selID, price } = req.body;
    console.log(selID);
    res.send(await settingCtrl.setSelUserPrice(selID, price));
  } catch (e) {
    res.status(500).json({ success: false, message: `API error ${e.message}` });
  }
});
module.exports = setting;
