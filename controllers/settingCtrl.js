const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
const {
  getUserCollection,
  getMaterialCollection,
  getSettingCollection,
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
  const getSelUserInformation = async (selUserId) => {
    try {
      const collection = getUserCollection();
      const result = await collection.findOne({
        _id: new ObjectId(selUserId),
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
    avatarPath
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
    curSilver,
    curBronze,
    curAddress,
    curCity,
    curState,
    curZipcode,
    curTel
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
            loyalty_silver: curSilver,
            loyalty_bronze: curBronze,
            address: curAddress,
            city: curCity,
            state: curState,
            zipcode: curZipcode,
            telephone: curTel,
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
  const getFAQs = async (itemsPerPage, currentPage) => {
    try {
      const collection = getFAQCollection();

      const limit = parseInt(itemsPerPage, 10);
      const page = parseInt(currentPage, 10);
      const skip = (page - 1) * limit;

      const materials = await collection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalItems = await collection.countDocuments();

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

      // Check if the material with the given ID exists
      const selData = await collection.findOne({ _id: new ObjectId(selID) });

      if (!selData) {
        return {
          success: false,
          message: "Material with the given ID does not exist.",
        };
      }

      // Update the material details
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
    getSettings,
    updateSetting,
    getFAQs,
    addFAQ,
    editFAQ,
    delFAQ,
    getSupplier,
    editSupplier,
    delSupplier,
  };
};

module.exports = settingCtrl();
