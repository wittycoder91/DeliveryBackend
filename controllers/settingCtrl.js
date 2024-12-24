const bcrypt = require("bcryptjs");
const { ObjectId, Double } = require("mongodb");
const {
  getUserCollection,
  getMaterialCollection,
  getIndustryCollection,
  getSettingCollection,
  getColorCollection,
  getResidueCollection,
  getConditionCollection,
  getPackageCollection,
  getQualityCollection,
} = require("../helpers/db-conn");

const settingCtrl = () => {
  // User Management
  const getAllUsers = async () => {
    try {
      const collection = getUserCollection();
      const result = await collection.find().toArray();

      return {
        success: true,
        message: "Success!",
        data: result,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getSelUserInformation = async (selID) => {
    try {
      const collection = getUserCollection();
      const result = await collection.findOne({
        _id: new ObjectId(selID),
      });

      if (result) {
        return {
          success: true,
          message: "Success!",
          data: result,
        };
      } else {
        return {
          success: false,
          message: "User not found.",
        };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const UpdateUserInformation = async (
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
  ) => {
    const collectionUser = getUserCollection();

    selData = await collectionUser.findOne({
      _id: new ObjectId(userId),
    });

    if (selData) {
      const isMatch = await bcrypt.compare(password, selData.password);

      if (!isMatch) {
        return {
          success: false,
          message: "Please input the password correctly.",
        };
      }

      // Build the update object dynamically
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newpassword, salt);
      const updateFields = {
        name: name,
        email: email,
        password: hashedPassword,
        address: address,
        city: city,
        state: state,
        zipcode: zipcode,
        avatarPath: avatarPath,
        phonenumber,
        contact,
        industry,
        w9Path,
      };

      // Update the document and return the updated data
      updateData = await collectionUser.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: updateFields },
        { returnDocument: "after" }
      );

      if (updateData) {
        return {
          success: true,
          message: "The user information has been updated successfully",
          data: updateData,
        };
      } else {
        return { success: false, message: "User not found." };
      }
    } else {
      return { success: false, message: "User not found." };
    }
  };

  // Packages Management
  const getAllPackages = async () => {
    try {
      const collection = getPackageCollection();
      const result = await collection.find().toArray();

      return {
        success: true,
        message: "Success!",
        data: result,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // Quality Management
  const getAllQualitys = async () => {
    try {
      const collection = getQualityCollection();
      const result = await collection.find().toArray();

      return {
        success: true,
        message: "Success!",
        data: result,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // Material Management
  const getAllMaterials = async () => {
    try {
      const collection = getMaterialCollection();
      const materials = await collection.find().toArray();

      return {
        success: true,
        message: "Success!",
        data: materials,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getMaterials = async (curSearh, itemsPerPage, currentPage) => {
    try {
      const collection = getMaterialCollection();

      const limit = parseInt(itemsPerPage, 10);
      const page = parseInt(currentPage, 10);
      const skip = (page - 1) * limit;

      const query = curSearh
        ? { materialName: { $regex: curSearh, $options: "i" } }
        : {};

      const materials = await collection
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalItems = await collection.countDocuments(query);

      return {
        success: true,
        message: "Success!",
        totalCount: totalItems,
        data: materials,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const addMaterial = async (materialName, materialDesc, note) => {
    try {
      const collection = getMaterialCollection();
      const result = await collection
        .find({ materialName: materialName })
        .toArray();

      if (result.length > 0) {
        return {
          success: false,
          message: "This material is exist.",
        };
      } else {
        await collection.insertOne({
          materialName: materialName,
          materialDesc: materialDesc,
          note: note,
        });

        return {
          success: true,
          message: "The Data has been added successfully.",
        };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const editMaterial = async (selID, materialName, materialDesc, note) => {
    try {
      const collection = getMaterialCollection();

      // Check if the material with the given ID exists
      const selData = await collection.findOne({ _id: new ObjectId(selID) });

      if (!selData) {
        return {
          success: false,
          message: "Material with the given ID does not exist.",
        };
      }

      // Check if another material with the same name exists
      const result = await collection.findOne({
        materialName: materialName,
        _id: { $ne: new ObjectId(selID) },
      });

      if (result) {
        return {
          success: false,
          message: "This material name already exists.",
        };
      }

      // Update the material details
      await collection.updateOne(
        { _id: new ObjectId(selID) },
        {
          $set: {
            materialName: materialName,
            materialDesc: materialDesc,
            note: note,
          },
        }
      );

      return {
        success: true,
        message: "The data has been updated successfully.",
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const delMaterial = async (selId) => {
    try {
      const collection = getMaterialCollection();
      const result = await collection.deleteOne({
        _id: new ObjectId(selId),
      });

      if (result) {
        return { success: true, message: "Removed data Successfully" };
      } else {
        return { success: false, message: "MongDB API Error" };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // Industry Management
  const getIndustry = async (curSearh, itemsPerPage, currentPage) => {
    try {
      const collection = getIndustryCollection();

      const limit = parseInt(itemsPerPage, 10);
      const page = parseInt(currentPage, 10);
      const skip = (page - 1) * limit;

      const query = curSearh
        ? { industryName: { $regex: curSearh, $options: "i" } }
        : {};

      const industry = await collection
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalItems = await collection.countDocuments(query);

      return {
        success: true,
        message: "Success!",
        totalCount: totalItems,
        data: industry,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const addIndustry = async (industryName, industryDesc, note) => {
    try {
      const collection = getIndustryCollection();
      const result = await collection
        .find({ industryName: industryName })
        .toArray();

      if (result.length > 0) {
        return {
          success: false,
          message: "This industry is exist.",
        };
      } else {
        await collection.insertOne({
          industryName: industryName,
          industryDesc: industryDesc,
          note: note,
        });

        return {
          success: true,
          message: "The Data has been added successfully.",
        };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const editIndustry = async (selID, industryName, industryDesc, note) => {
    try {
      const collection = getIndustryCollection();

      // Check if the industry with the given ID exists
      const selData = await collection.findOne({ _id: new ObjectId(selID) });

      if (!selData) {
        return {
          success: false,
          message: "Industry with the given ID does not exist.",
        };
      }

      // Check if another industry with the same name exists
      const result = await collection.findOne({
        industryName: industryName,
        _id: { $ne: new ObjectId(selID) },
      });

      if (result) {
        return {
          success: false,
          message: "This industry name already exists.",
        };
      }

      // Update the industry details
      await collection.updateOne(
        { _id: new ObjectId(selID) },
        {
          $set: {
            industryName: industryName,
            industryDesc: industryDesc,
            note: note,
          },
        }
      );

      return {
        success: true,
        message: "The data has been updated successfully.",
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const delIndustry = async (selId) => {
    try {
      const collection = getIndustryCollection();
      const result = await collection.deleteOne({
        _id: new ObjectId(selId),
      });

      if (result) {
        return { success: true, message: "Removed data Successfully" };
      } else {
        return { success: false, message: "MongDB API Error" };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // Color Management
  const getAllColor = async () => {
    try {
      const collection = getColorCollection();
      const color = await collection.find().toArray();

      return {
        success: true,
        message: "Success!",
        data: color,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getColor = async (curSearh, itemsPerPage, currentPage) => {
    try {
      const collection = getColorCollection();

      const limit = parseInt(itemsPerPage, 10);
      const page = parseInt(currentPage, 10);
      const skip = (page - 1) * limit;

      const query = curSearh
        ? { colorName: { $regex: curSearh, $options: "i" } }
        : {};

      const color = await collection
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalItems = await collection.countDocuments(query);

      return {
        success: true,
        message: "Success!",
        totalCount: totalItems,
        data: color,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const addColor = async (colorName, colorDesc, note) => {
    try {
      const collection = getColorCollection();
      const result = await collection.find({ colorName: colorName }).toArray();

      if (result.length > 0) {
        return {
          success: false,
          message: "This color is exist.",
        };
      } else {
        await collection.insertOne({
          colorName: colorName,
          colorDesc: colorDesc,
          note: note,
        });

        return {
          success: true,
          message: "The Data has been added successfully.",
        };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const editColor = async (selID, colorName, colorDesc, note) => {
    try {
      const collection = getColorCollection();

      // Check if the color with the given ID exists
      const selData = await collection.findOne({ _id: new ObjectId(selID) });

      if (!selData) {
        return {
          success: false,
          message: "Color with the given ID does not exist.",
        };
      }

      // Check if another color with the same name exists
      const result = await collection.findOne({
        colorName: colorName,
        _id: { $ne: new ObjectId(selID) },
      });

      if (result) {
        return {
          success: false,
          message: "This color name already exists.",
        };
      }

      // Update the color details
      await collection.updateOne(
        { _id: new ObjectId(selID) },
        {
          $set: {
            colorName: colorName,
            colorDesc: colorDesc,
            note: note,
          },
        }
      );

      return {
        success: true,
        message: "The data has been updated successfully.",
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const delColor = async (selId) => {
    try {
      const collection = getColorCollection();
      const result = await collection.deleteOne({
        _id: new ObjectId(selId),
      });

      if (result) {
        return { success: true, message: "Removed data Successfully" };
      } else {
        return { success: false, message: "MongDB API Error" };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // Residue Materials Management
  const getAllResidueMaterials = async () => {
    try {
      const collection = getResidueCollection();
      const residues = await collection.find().toArray();

      return {
        success: true,
        message: "Success!",
        data: residues,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getResidueMaterials = async (curSearh, itemsPerPage, currentPage) => {
    try {
      const collection = getResidueCollection();

      const limit = parseInt(itemsPerPage, 10);
      const page = parseInt(currentPage, 10);
      const skip = (page - 1) * limit;

      const query = curSearh
        ? { residueName: { $regex: curSearh, $options: "i" } }
        : {};

      const residue = await collection
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalItems = await collection.countDocuments(query);

      return {
        success: true,
        message: "Success!",
        totalCount: totalItems,
        data: residue,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const addResidueMaterials = async (residueName, residueDesc, note) => {
    try {
      const collection = getResidueCollection();
      const result = await collection
        .find({ residueName: residueName })
        .toArray();

      if (result.length > 0) {
        return {
          success: false,
          message: "This Residue Material is exist.",
        };
      } else {
        await collection.insertOne({
          residueName: residueName,
          residueDesc: residueDesc,
          note: note,
        });

        return {
          success: true,
          message: "The Data has been added successfully.",
        };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const editResidueMaterials = async (
    selID,
    residueName,
    residueDesc,
    note
  ) => {
    try {
      const collection = getResidueCollection();

      // Check if the residue with the given ID exists
      const selData = await collection.findOne({ _id: new ObjectId(selID) });

      if (!selData) {
        return {
          success: false,
          message: "Residue Material with the given ID does not exist.",
        };
      }

      // Check if another residue with the same name exists
      const result = await collection.findOne({
        residueName: residueName,
        _id: { $ne: new ObjectId(selID) },
      });

      if (result) {
        return {
          success: false,
          message: "This Residue Material name already exists.",
        };
      }

      // Update the residue details
      await collection.updateOne(
        { _id: new ObjectId(selID) },
        {
          $set: {
            residueName: residueName,
            residueDesc: residueDesc,
            note: note,
          },
        }
      );

      return {
        success: true,
        message: "The data has been updated successfully.",
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const delResidueMaterials = async (selId) => {
    try {
      const collection = getResidueCollection();
      const result = await collection.deleteOne({
        _id: new ObjectId(selId),
      });

      if (result) {
        return { success: true, message: "Removed data Successfully" };
      } else {
        return { success: false, message: "MongDB API Error" };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // Conditions Management
  const getAllConditions = async () => {
    try {
      const collection = getConditionCollection();
      const conditions = await collection.find().toArray();

      return {
        success: true,
        message: "Success!",
        data: conditions,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getConditions = async (curSearh, itemsPerPage, currentPage) => {
    try {
      const collection = getConditionCollection();

      const limit = parseInt(itemsPerPage, 10);
      const page = parseInt(currentPage, 10);
      const skip = (page - 1) * limit;

      const query = curSearh
        ? { conditionName: { $regex: curSearh, $options: "i" } }
        : {};

      const condition = await collection
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalItems = await collection.countDocuments(query);

      return {
        success: true,
        message: "Success!",
        totalCount: totalItems,
        data: condition,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const addConditions = async (conditionName, conditionDesc, note) => {
    try {
      const collection = getConditionCollection();
      const result = await collection
        .find({ conditionName: conditionName })
        .toArray();

      if (result.length > 0) {
        return {
          success: false,
          message: "This Condition is exist.",
        };
      } else {
        await collection.insertOne({
          conditionName: conditionName,
          conditionDesc: conditionDesc,
          note: note,
        });

        return {
          success: true,
          message: "The Data has been added successfully.",
        };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const editConditions = async (selID, conditionName, conditionDesc, note) => {
    try {
      const collection = getConditionCollection();

      // Check if the condition with the given ID exists
      const selData = await collection.findOne({ _id: new ObjectId(selID) });

      if (!selData) {
        return {
          success: false,
          message: "Condition with the given ID does not exist.",
        };
      }

      // Check if another condition with the same name exists
      const result = await collection.findOne({
        conditionName: conditionName,
        _id: { $ne: new ObjectId(selID) },
      });

      if (result) {
        return {
          success: false,
          message: "This Condition name already exists.",
        };
      }

      // Update the condition details
      await collection.updateOne(
        { _id: new ObjectId(selID) },
        {
          $set: {
            conditionName: conditionName,
            conditionDesc: conditionDesc,
            note: note,
          },
        }
      );

      return {
        success: true,
        message: "The data has been updated successfully.",
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const delConditions = async (selId) => {
    try {
      const collection = getConditionCollection();
      const result = await collection.deleteOne({
        _id: new ObjectId(selId),
      });

      if (result) {
        return { success: true, message: "Removed data Successfully" };
      } else {
        return { success: false, message: "MongDB API Error" };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // Setting Management
  const getSettings = async () => {
    try {
      const collection = getSettingCollection();

      const settings = await collection.findOne({});

      if (!settings) {
        return {
          success: false,
          message: "Settings not found.",
        };
      }

      // Send the settings as the response
      return {
        success: true,
        data: settings,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const updateSetting = async (
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
  ) => {
    try {
      const collection = getSettingCollection();

      await collection.updateOne(
        {},
        {
          $set: {
            firsttime: curFirstTime,
            secondtime: curSecondTime,
            thirdtime: curThirdTime,
            fourthtime: curFourthTime,
            loyalty_golden: curGolden,
            loyalty_golden_benefit: curGoldenBenefit,
            loyalty_silver_benefit: curSilverBenefit,
            loyalty_bronze_benefit: curBronzeBenefit,
            loyalty_silver: curSilver,
            loyalty_bronze: curBronze,
            address: curAddress,
            city: curCity,
            state: curState,
            zipcode: curZipcode,
            telephone: curTel,
            terms: curPrivacy,
            report: curReport,
          },
        }
      );

      return {
        success: true,
        message: "The setting value has been successfully updated.",
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // FAQ Management
  const getAllFAQs = async () => {
    try {
      const collection = getFAQCollection();
      const data = await collection.find().toArray();

      return {
        success: true,
        message: "Success!",
        data: data,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getFAQs = async (itemsPerPage, currentPage) => {
    try {
      const collection = getFAQCollection();

      const limit = parseInt(itemsPerPage, 10);
      const page = parseInt(currentPage, 10);
      const skip = (page - 1) * limit;

      const faqs = await collection.find().skip(skip).limit(limit).toArray();
      const totalItems = await collection.countDocuments();

      return {
        success: true,
        message: "Success!",
        totalCount: totalItems,
        data: faqs,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const addFAQ = async (curTitle, curContent) => {
    try {
      const collection = getFAQCollection();

      await collection.insertOne({
        title: curTitle,
        content: curContent,
      });

      return {
        success: true,
        message: "The Data has been added successfully.",
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const editFAQ = async (selID, curTitle, curContent) => {
    try {
      const collection = getFAQCollection();

      // Check if the faq with the given ID exists
      const selData = await collection.findOne({ _id: new ObjectId(selID) });

      if (!selData) {
        return {
          success: false,
          message: "FAQ with the given ID does not exist.",
        };
      }

      // Update the faq details
      await collection.updateOne(
        { _id: new ObjectId(selID) },
        {
          $set: {
            title: curTitle,
            content: curContent,
          },
        }
      );

      return {
        success: true,
        message: "The data has been updated successfully.",
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const delFAQ = async (selId) => {
    try {
      const collection = getFAQCollection();
      const result = await collection.deleteOne({
        _id: new ObjectId(selId),
      });

      if (result) {
        return { success: true, message: "Removed data Successfully" };
      } else {
        return { success: false, message: "MongDB API Error" };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  // Supplier Management
  const getSupplier = async (curSearh, itemsPerPage, currentPage) => {
    try {
      const collection = getUserCollection();

      const limit = parseInt(itemsPerPage, 10);
      const page = parseInt(currentPage, 10);
      const skip = (page - 1) * limit;

      const query = curSearh
        ? {
            $or: [
              { name: { $regex: curSearh, $options: "i" } },
              { email: { $regex: curSearh, $options: "i" } },
            ],
          }
        : {};

      const suppliers = await collection
        .find(query)
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalItems = await collection.countDocuments(query);

      return {
        success: true,
        message: "Success!",
        totalCount: totalItems,
        data: suppliers,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const editSupplier = async (selID, trust) => {
    try {
      const collection = getUserCollection();

      // Check if the supplier with the given ID exists
      const selData = await collection.findOne({ _id: new ObjectId(selID) });

      if (!selData) {
        return {
          success: false,
          message: "Supplier with the given ID does not exist.",
        };
      }

      // Update the supplier details
      await collection.updateOne(
        { _id: new ObjectId(selID) },
        {
          $set: {
            trust: trust,
          },
        }
      );

      return {
        success: true,
        message: "The data has been updated successfully.",
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const delSupplier = async (selId) => {
    try {
      const collection = getUserCollection();
      const result = await collection.deleteOne({
        _id: new ObjectId(selId),
      });

      if (result) {
        return { success: true, message: "Removed data Successfully" };
      } else {
        return { success: false, message: "MongDB API Error" };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const setSelUserPrice = async (selID, price) => {
    try {
      const collection = getUserCollection();

      const updateFields = { price: new Double(parseFloat(price).toFixed(2)) };

      // Update the document and return the updated data
      updateData = await collection.findOneAndUpdate(
        { _id: new ObjectId(selID) },
        { $set: updateFields },
        { returnDocument: "after" }
      );

      console.log(updateData);
      if (updateData) {
        return {
          success: true,
          message: "The price value has been updated successfully.",
        };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  return {
    getAllUsers,
    getSelUserInformation,
    UpdateUserInformation,
    getAllPackages,
    getAllQualitys,
    getAllMaterials,
    getMaterials,
    addMaterial,
    editMaterial,
    delMaterial,
    getIndustry,
    addIndustry,
    editIndustry,
    delIndustry,
    getAllResidueMaterials,
    getResidueMaterials,
    addResidueMaterials,
    editResidueMaterials,
    delResidueMaterials,
    getAllConditions,
    getConditions,
    addConditions,
    editConditions,
    delConditions,
    getAllColor,
    getColor,
    addColor,
    editColor,
    delColor,
    getSettings,
    updateSetting,
    getAllFAQs,
    getFAQs,
    addFAQ,
    editFAQ,
    delFAQ,
    getSupplier,
    editSupplier,
    delSupplier,
    setSelUserPrice,
  };
};

module.exports = settingCtrl();
