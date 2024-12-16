const axios = require("axios");
const { ObjectId } = require("mongodb");
const {
  getDeliveryCollection,
  getUserCollection,
  getMaterialCollection,
  getPackageCollection,
  getDeliveryLogsCollection,
  getSettingCollection,
} = require("../helpers/db-conn");

const deliveryCtrl = () => {
  // Delivery Management
  const setReadDelivery = async () => {
    try {
      const collection = getDeliveryCollection();

      // Update all documents with read: false to read: true
      const result = await collection.updateMany(
        { read: false },
        { $set: { read: true } }
      );

      return {
        success: true,
        message: `${result.modifiedCount} documents were updated successfully.`,
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const addDelivery = async (
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
  ) => {
    const collection = getDeliveryCollection();
    const collectionUser = getUserCollection();
    const collectionMaterial = getMaterialCollection();
    const collectionPackage = getPackageCollection();
    let curStatus = 0;
    let curPO = 0;

    // Searches the database for a user with the same userId.
    const selUser = await collectionUser.findOne({ _id: new ObjectId(userId) });
    if (selUser) {
      if (selUser?.trust === 1) {
        curStatus = 1;

        const latestDelivery = await collection
          .find()
          .sort({ po: -1 })
          .limit(1)
          .toArray();

        if (latestDelivery) {
          if (latestDelivery[0].po === 0) curPO = 240001;
          else curPO = latestDelivery[0].po + 1;
        }
      }
    }

    const delivery = await collection.insertOne({
      userId,
      po: curPO,
      material,
      weight: parseFloat(weight),
      packaging,
      countpackage: parseInt(countpackage, 10),
      color,
      residue,
      condition,
      status: curStatus,
      date,
      time: parseInt(time, 10),
      avatarPath,
      read: false,
    });

    if (delivery) {
      const deliveries = await collection
        .find({
          read: false,
        })
        .toArray();

      const result = await Promise.all(
        deliveries.map(async (delivery) => {
          // Fetch user data
          const user = await collectionUser.findOne({
            _id: new ObjectId(delivery.userId),
          });
          const userName = user ? user.name : null;

          // Fetch material data
          const material = await collectionMaterial.findOne({
            _id: new ObjectId(delivery.material),
          });
          const materialName = material ? material.materialName : null;

          // Fetch packaging data
          const packaging = await collectionPackage.findOne({
            _id: new ObjectId(delivery.packaging),
          });
          const packagingName = packaging ? packaging.name : null;

          return {
            ...delivery,
            userName,
            materialName,
            packagingName,
          };
        })
      );

      // Emit the updated notification count to all clients
      axios.post("http://localhost:6000/broadcast", {
        type: "ADD_DELIVERY",
        message: "A new delivery has been added",
        count: deliveries.length,
        data: result,
      });

      return {
        success: true,
        message: "The delivery request added successfully",
      };
    } else {
      return { success: false, message: "MongoDB API error" };
    }
  };
  const getLastestDelivery = async () => {
    try {
      const collection = getDeliveryCollection();

      const latestDelivery = await collection
        .find()
        .sort({ _id: -1 })
        .limit(1)
        .toArray();

      if (latestDelivery && latestDelivery.length > 0) {
        return { success: true, data: latestDelivery[0] };
      } else {
        return { success: false, message: "No deliveries found" };
      }
    } catch (error) {
      return { success: false, message: "An error occurred: " + error.message };
    }
  };
  const getDeliverys = async (
    curSupplier,
    curMaterial,
    curPackage,
    curSearh,
    itemsPerPage,
    currentPage
  ) => {
    try {
      const deliveryCollection = getDeliveryCollection();
      const limit = parseInt(itemsPerPage, 10);
      const page = parseInt(currentPage, 10);
      const skip = (page - 1) * limit;

      // Build the match stage for filtering
      const matchStage = {};
      if (curSupplier && curSupplier !== "0") {
        try {
          matchStage.userId = curSupplier;
        } catch (e) {
          console.error("Invalid supplier ID:", curSupplier);
        }
      }
      if (curMaterial && curMaterial !== "0") {
        try {
          matchStage.material = curMaterial;
        } catch (e) {
          console.error("Invalid material ID:", curMaterial);
        }
      }
      if (curPackage && curPackage !== "0") {
        try {
          matchStage.packaging = curPackage;
        } catch (e) {
          console.error("Invalid package ID:", curPackage);
        }
      }

      if (curSearh) {
        matchStage.$or = [
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$po" },
                regex: curSearh,
                options: "i",
              },
            },
          },
          { userName: { $regex: curSearh, $options: "i" } },
          { materialName: { $regex: curSearh, $options: "i" } },
          { packageName: { $regex: curSearh, $options: "i" } },
        ];
      }

      // Aggregation pipeline
      const results = await deliveryCollection
        .aggregate([
          {
            $addFields: {
              userSelId: { $toObjectId: "$userId" },
              materialId: { $toObjectId: "$material" },
              packageId: { $toObjectId: "$packaging" },
            },
          },
          {
            $lookup: {
              from: "materials", // Join with materials collection
              localField: "materialId",
              foreignField: "_id",
              as: "materialDetails",
            },
          },
          {
            $lookup: {
              from: "users", // Join with users collection
              localField: "userSelId",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $lookup: {
              from: "packages", // Join with packages collection
              localField: "packageId",
              foreignField: "_id",
              as: "packageDetails",
            },
          },
          {
            $addFields: {
              userName: { $arrayElemAt: ["$userDetails.name", 0] },
              materialName: {
                $arrayElemAt: ["$materialDetails.materialName", 0],
              },
              packageName: {
                $arrayElemAt: ["$packageDetails.name", 0],
              },
            },
          },
          {
            $unset: [
              "userDetails",
              "materialDetails",
              "packageDetails",
              "userSelId",
              "materialId",
              "packageId",
            ],
          },
          {
            $facet: {
              totalCount: [{ $match: matchStage }, { $count: "count" }],
              data: [
                { $match: matchStage },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limit },
              ],
            },
          },
        ])
        .toArray();

      const totalCount = results[0].totalCount[0]?.count || 0;
      const data = results[0].data;

      return {
        success: true,
        message: "Success!",
        totalCount: totalCount,
        data: data,
      };
    } catch (e) {
      console.error("Error in getDeliverys:", e); // Log any errors
      return { success: false, message: e.message };
    }
  };
  const getSelDelivery = async (selDeliveryId) => {
    try {
      const deliveryCollection = getDeliveryCollection();
      const usersCollection = getUserCollection();
      const materialsCollection = getMaterialCollection();
      const packagesCollection = getPackageCollection();

      // Find the selected delivery by ID
      const delivery = await deliveryCollection.findOne({
        _id: new ObjectId(selDeliveryId),
      });
      if (!delivery) {
        return { success: false, message: "Delivery not found." };
      }

      // Fetch details for userId, material, and packaging
      const user = await usersCollection.findOne({
        _id: new ObjectId(delivery.userId),
      });
      const material = await materialsCollection.findOne({
        _id: new ObjectId(delivery.material),
      });
      const packaging = await packagesCollection.findOne({
        _id: new ObjectId(delivery.packaging),
      });

      // Replace the fields in the delivery object
      const updatedDelivery = {
        ...delivery,
        username: user ? user.name : null,
        material: material ? material.materialName : null,
        packaging: packaging ? packaging.name : null,
      };

      return {
        success: true,
        message: "Success!",
        data: updatedDelivery,
      };
    } catch (e) {
      console.error("Error in getSelDelivery:", e);
      return { success: false, message: e.message };
    }
  };
  const updateSelDelivery = async (selDeliveryId, status) => {
    try {
      const collection = getDeliveryCollection();
      const usersCollection = getUserCollection();
      const materialsCollection = getMaterialCollection();
      const packagesCollection = getPackageCollection();
      const deliverylogsCollection = getDeliveryLogsCollection();

      let updateData = {};
      if (status === -1) {
        const selData = await collection.findOne({
          _id: new ObjectId(selDeliveryId),
        });

        if (selData) {
          selData.status = -1;

          await collection.deleteOne({
            _id: new ObjectId(selDeliveryId),
          });

          const { _id, ...dataWithoutId } = selData;
          dataWithoutId.feedback = "";
          const insertResult = await deliverylogsCollection.insertOne(
            dataWithoutId
          );
          updateData = await deliverylogsCollection.findOne({
            _id: new ObjectId(insertResult.insertedId),
          });
        } else {
          return { success: false, message: "Delivery not found." };
        }
      } else {
        let curPO = null;
        if (status === 0) {
          // Fetch the latest delivery with the highest 'po'
          const latestDelivery = await collection
            .find()
            .sort({ po: -1 })
            .limit(1)
            .toArray();

          // Determine the new `po` value
          curPO =
            latestDelivery.length > 0 && latestDelivery[0].po !== 0
              ? latestDelivery[0].po + 1
              : 240001;
        }

        // Build the update object dynamically
        const updateFields = { status: status + 1 };
        if (curPO !== null) {
          updateFields.po = curPO;
        }

        // Update the document and return the updated data
        updateData = await collection.findOneAndUpdate(
          { _id: new ObjectId(selDeliveryId) },
          { $set: updateFields },
          { returnDocument: "after" }
        );
      }

      if (updateData) {
        // Fetch details for userId, material, and packaging
        const user = await usersCollection.findOne({
          _id: new ObjectId(updateData.userId),
        });
        const material = await materialsCollection.findOne({
          _id: new ObjectId(updateData.material),
        });
        const packaging = await packagesCollection.findOne({
          _id: new ObjectId(updateData.packaging),
        });

        // Replace the fields in the delivery object
        const updatedDelivery = {
          ...updateData,
          userName: user ? user.name : null,
          materialName: material ? material.materialName : null,
          packagingName: packaging ? packaging.name : null,
        };

        // Emit the updated notification count to all clients
        axios.post("http://localhost:6000/broadcast", {
          type: "UPDATE_DELIVERY",
          message: "A new delivery has been added",
          count: 1,
          delieryData: updatedDelivery,
        });

        return {
          success: true,
          message:
            "Your delivery request status has been successfully updated.",
        };
      } else {
        return { success: false, message: "MongDB API Error" };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const addDeliveryFeedback = async (
    selID,
    curStatus,
    curDeliveryAmount,
    curDeliveryFeedback
  ) => {
    try {
      const collection = getDeliveryCollection();
      const usersCollection = getUserCollection();
      const materialsCollection = getMaterialCollection();
      const packagesCollection = getPackageCollection();
      const deliverylogsCollection = getDeliveryLogsCollection();

      let updateData = {};
      const selData = await collection.findOne({
        _id: new ObjectId(selID),
      });

      if (selData) {
        selData.status = curStatus + 1;

        let selUserId = selData.userId;
        let curTotalWeight = 0;

        const selUserData = await usersCollection.findOne({
          _id: new ObjectId(selUserId),
        });
        if (selUserData) {
          curTotalWeight = selUserData.totalweight;
        }
        curTotalWeight = curDeliveryAmount + curTotalWeight;
        curTotalWeight = parseFloat(curTotalWeight.toFixed(2));

        // Get the loyalty data
        const settingCollection = getSettingCollection();
        const settings = await settingCollection.findOne({});
        let valGolen = 0;
        let valSilver = 0;
        let valBronze = 0;
        let valLoyalty = 0;

        if (settings) {
          valGolen = settings.loyalty_golden;
          valSilver = settings.loyalty_silver;
          valBronze = settings.loyalty_bronze;

          if (curTotalWeight >= valGolen) valLoyalty = 3;
          else if (curTotalWeight >= valSilver) valLoyalty = 2;
          else if (curTotalWeight >= valBronze) valLoyalty = 1;
        }

        // Remove the delivery data
        await collection.deleteOne({
          _id: new ObjectId(selID),
        });

        const { _id, ...dataWithoutId } = selData;
        dataWithoutId.weight = curDeliveryAmount;
        dataWithoutId.feedback = curDeliveryFeedback;

        // // Update the user collection and return the updated data
        const updateFields = {
          totalweight: curTotalWeight,
          loyalty: valLoyalty,
        };
        updateData = await usersCollection.findOneAndUpdate(
          { _id: new ObjectId(selUserId) },
          { $set: updateFields },
          { returnDocument: "after" }
        );

        // // Insert the data to the deliverylogs collection
        const insertResult = await deliverylogsCollection.insertOne(
          dataWithoutId
        );
        updateData = await deliverylogsCollection.findOne({
          _id: new ObjectId(insertResult.insertedId),
        });
      } else {
        return { success: false, message: "Delivery not found." };
      }

      if (updateData) {
        // Fetch details for userId, material, and packaging
        const user = await usersCollection.findOne({
          _id: new ObjectId(updateData.userId),
        });
        const material = await materialsCollection.findOne({
          _id: new ObjectId(updateData.material),
        });
        const packaging = await packagesCollection.findOne({
          _id: new ObjectId(updateData.packaging),
        });

        // Replace the fields in the delivery object
        const updatedDelivery = {
          ...updateData,
          userName: user ? user.name : null,
          materialName: material ? material.materialName : null,
          packagingName: packaging ? packaging.name : null,
        };

        // Emit the updated notification count to all clients
        axios.post("http://localhost:6000/broadcast", {
          type: "UPDATE_DELIVERY",
          message: "A new delivery has been added",
          count: 1,
          delieryData: updatedDelivery,
        });

        return {
          success: true,
          message:
            "Your delivery request status has been successfully updated.",
        };
      } else {
        return { success: false, message: "MongDB API Error" };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getDeliveryLogs = async (
    curSupplier,
    curMaterial,
    curPackage,
    curSearh,
    itemsPerPage,
    currentPage
  ) => {
    try {
      const deliveryLogsCollection = getDeliveryLogsCollection();
      const limit = parseInt(itemsPerPage, 10);
      const page = parseInt(currentPage, 10);
      const skip = (page - 1) * limit;

      // Build the match stage for filtering
      const matchStage = {};
      if (curSupplier && curSupplier !== "0") {
        try {
          matchStage.userId = curSupplier;
        } catch (e) {
          console.error("Invalid supplier ID:", curSupplier);
        }
      }
      if (curMaterial && curMaterial !== "0") {
        try {
          matchStage.material = curMaterial;
        } catch (e) {
          console.error("Invalid material ID:", curMaterial);
        }
      }
      if (curPackage && curPackage !== "0") {
        try {
          matchStage.packaging = curPackage;
        } catch (e) {
          console.error("Invalid package ID:", curPackage);
        }
      }

      if (curSearh) {
        matchStage.$or = [
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$po" },
                regex: curSearh,
                options: "i",
              },
            },
          },
          { userName: { $regex: curSearh, $options: "i" } },
          { materialName: { $regex: curSearh, $options: "i" } },
          { packageName: { $regex: curSearh, $options: "i" } },
        ];
      }

      // Aggregation pipeline
      const results = await deliveryLogsCollection
        .aggregate([
          {
            $addFields: {
              userSelId: { $toObjectId: "$userId" },
              materialId: { $toObjectId: "$material" },
              packageId: { $toObjectId: "$packaging" },
            },
          },
          {
            $lookup: {
              from: "materials", // Join with materials collection
              localField: "materialId",
              foreignField: "_id",
              as: "materialDetails",
            },
          },
          {
            $lookup: {
              from: "users", // Join with users collection
              localField: "userSelId",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $lookup: {
              from: "packages", // Join with packages collection
              localField: "packageId",
              foreignField: "_id",
              as: "packageDetails",
            },
          },
          {
            $addFields: {
              userName: { $arrayElemAt: ["$userDetails.name", 0] },
              materialName: {
                $arrayElemAt: ["$materialDetails.materialName", 0],
              },
              packageName: {
                $arrayElemAt: ["$packageDetails.name", 0],
              },
            },
          },
          {
            $unset: [
              "userDetails",
              "materialDetails",
              "packageDetails",
              "userSelId",
              "materialId",
              "packageId",
            ],
          },
          {
            $facet: {
              totalCount: [{ $match: matchStage }, { $count: "count" }],
              data: [
                { $match: matchStage },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limit },
              ],
            },
          },
        ])
        .toArray();

      const totalCount = results[0].totalCount[0]?.count || 0;
      const data = results[0].data;

      return {
        success: true,
        message: "Success!",
        totalCount: totalCount,
        data: data,
      };
    } catch (e) {
      console.error("Error in getDeliverys:", e);
      return { success: false, message: e.message };
    }
  };
  const getSelDeliveryLog = async (selDeliveryId) => {
    try {
      const deliveryLogCollection = getDeliveryLogsCollection();
      const usersCollection = getUserCollection();
      const materialsCollection = getMaterialCollection();
      const packagesCollection = getPackageCollection();

      // Find the selected delivery by ID
      const delivery = await deliveryLogCollection.findOne({
        _id: new ObjectId(selDeliveryId),
      });
      if (!delivery) {
        return { success: false, message: "Delivery not found." };
      }

      // Fetch details for userId, material, and packaging
      const user = await usersCollection.findOne({
        _id: new ObjectId(delivery.userId),
      });
      const material = await materialsCollection.findOne({
        _id: new ObjectId(delivery.material),
      });
      const packaging = await packagesCollection.findOne({
        _id: new ObjectId(delivery.packaging),
      });

      // Replace the fields in the delivery object
      const updatedDelivery = {
        ...delivery,
        username: user ? user.name : null,
        material: material ? material.materialName : null,
        packaging: packaging ? packaging.name : null,
      };

      return {
        success: true,
        message: "Success!",
        data: updatedDelivery,
      };
    } catch (e) {
      console.error("Error in getSelDelivery:", e);
      return { success: false, message: e.message };
    }
  };
  const getUserDeliverys = async (
    userId,
    curMaterial,
    curPackage,
    curSearh
  ) => {
    try {
      const deliveryCollection = getDeliveryCollection();

      // Build the match stage for filtering
      const matchStage = {
        userId, // Ensure userId is always part of the filter
      };

      // Add optional filters
      if (curMaterial && curMaterial !== "0") {
        try {
          matchStage.material = curMaterial;
        } catch (e) {
          console.error("Invalid material ID:", curMaterial);
        }
      }

      if (curPackage && curPackage !== "0") {
        try {
          matchStage.packaging = curPackage;
        } catch (e) {
          console.error("Invalid package ID:", curPackage);
        }
      }

      if (curSearh) {
        matchStage.$or = [
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$po" },
                regex: curSearh,
                options: "i",
              },
            },
          },
          { materialName: { $regex: curSearh, $options: "i" } },
          { packageName: { $regex: curSearh, $options: "i" } },
        ];
      }

      // Aggregation pipeline
      const results = await deliveryCollection
        .aggregate([
          {
            $addFields: {
              materialId: { $toObjectId: "$material" },
              packageId: { $toObjectId: "$packaging" },
            },
          },
          {
            $lookup: {
              from: "materials", // Join with materials collection
              localField: "materialId",
              foreignField: "_id",
              as: "materialDetails",
            },
          },
          {
            $lookup: {
              from: "packages", // Join with packages collection
              localField: "packageId",
              foreignField: "_id",
              as: "packageDetails",
            },
          },
          {
            $addFields: {
              materialName: {
                $arrayElemAt: ["$materialDetails.materialName", 0],
              },
              packageName: {
                $arrayElemAt: ["$packageDetails.name", 0],
              },
            },
          },
          {
            $unset: [
              "materialDetails",
              "packageDetails",
              "materialId",
              "packageId",
            ],
          },
          {
            $facet: {
              totalCount: [{ $match: matchStage }, { $count: "count" }],
              data: [{ $match: matchStage }, { $sort: { _id: -1 } }],
            },
          },
        ])
        .toArray();

      const totalCount = results[0].totalCount[0]?.count || 0;
      const data = results[0].data;

      return {
        success: true,
        message: "Success!",
        totalCount: totalCount,
        data: data,
      };
    } catch (e) {
      console.error("Error in getUserDeliverys:", e); // Log any errors
      return { success: false, message: e.message };
    }
  };
  const updateUserSelDelivery = async (
    selDeliveryId,
    updateDate,
    updateTime
  ) => {
    try {
      const collection = getDeliveryCollection();
      const collectionUser = getUserCollection();
      const collectionMaterial = getMaterialCollection();
      const collectionPackage = getPackageCollection();

      const updateFields = {
        date: updateDate,
        time: parseInt(updateTime, 10),
        read: false,
      };
      const updateData = await collection.findOneAndUpdate(
        { _id: new ObjectId(selDeliveryId) },
        { $set: updateFields },
        { returnDocument: "after" }
      );

      if (updateData) {
        const deliveries = await collection
          .find({
            read: false,
          })
          .toArray();

        const result = await Promise.all(
          deliveries.map(async (delivery) => {
            // Fetch user data
            const user = await collectionUser.findOne({
              _id: new ObjectId(delivery.userId),
            });
            const userName = user ? user.name : null;

            // Fetch material data
            const material = await collectionMaterial.findOne({
              _id: new ObjectId(delivery.material),
            });
            const materialName = material ? material.materialName : null;

            // Fetch packaging data
            const packaging = await collectionPackage.findOne({
              _id: new ObjectId(delivery.packaging),
            });
            const packagingName = packaging ? packaging.name : null;

            return {
              ...delivery,
              userName,
              materialName,
              packagingName,
            };
          })
        );

        // Emit the updated notification count to all clients
        axios.post("http://localhost:6000/broadcast", {
          type: "ADD_DELIVERY",
          message: "The delivery data has been updated successfully",
          count: deliveries.length,
          data: result,
        });

        return {
          success: true,
          message: "Your delivery data has been successfully updated.",
        };
      } else {
        return { success: false, message: "MongDB API Error" };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getUserDeliveryLogs = async (
    userId,
    curMaterial,
    curPackage,
    curSearh,
    itemsPerPage,
    currentPage
  ) => {
    try {
      const deliveryLogsCollection = getDeliveryLogsCollection();
      const limit = parseInt(itemsPerPage, 10);
      const page = parseInt(currentPage, 10);
      const skip = (page - 1) * limit;

      // Build the match stage for filtering
      const matchStage = {
        userId, // Ensure userId is always part of the filter
      };

      if (curMaterial && curMaterial !== "0") {
        try {
          matchStage.material = curMaterial;
        } catch (e) {
          console.error("Invalid material ID:", curMaterial);
        }
      }
      if (curPackage && curPackage !== "0") {
        try {
          matchStage.packaging = curPackage;
        } catch (e) {
          console.error("Invalid package ID:", curPackage);
        }
      }

      if (curSearh) {
        matchStage.$or = [
          {
            $expr: {
              $regexMatch: {
                input: { $toString: "$po" },
                regex: curSearh,
                options: "i",
              },
            },
          },
          { materialName: { $regex: curSearh, $options: "i" } },
          { packageName: { $regex: curSearh, $options: "i" } },
        ];
      }

      // Aggregation pipeline
      const results = await deliveryLogsCollection
        .aggregate([
          {
            $addFields: {
              materialId: { $toObjectId: "$material" },
              packageId: { $toObjectId: "$packaging" },
            },
          },
          {
            $lookup: {
              from: "materials", // Join with materials collection
              localField: "materialId",
              foreignField: "_id",
              as: "materialDetails",
            },
          },
          {
            $lookup: {
              from: "packages", // Join with packages collection
              localField: "packageId",
              foreignField: "_id",
              as: "packageDetails",
            },
          },
          {
            $addFields: {
              materialName: {
                $arrayElemAt: ["$materialDetails.materialName", 0],
              },
              packageName: {
                $arrayElemAt: ["$packageDetails.name", 0],
              },
            },
          },
          {
            $unset: [
              "userDetails",
              "materialDetails",
              "packageDetails",
              "userSelId",
              "materialId",
              "packageId",
            ],
          },
          {
            $facet: {
              totalCount: [{ $match: matchStage }, { $count: "count" }],
              data: [
                { $match: matchStage },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limit },
              ],
            },
          },
        ])
        .toArray();

      const totalCount = results[0].totalCount[0]?.count || 0;
      const data = results[0].data;

      return {
        success: true,
        message: "Success!",
        totalCount: totalCount,
        data: data,
      };
    } catch (e) {
      console.error("Error in getDeliverys:", e);
      return { success: false, message: e.message };
    }
  };
  const getUserSelDeliveryLog = async (selDeliveryId) => {
    try {
      const deliveryLogCollection = getDeliveryLogsCollection();
      const materialsCollection = getMaterialCollection();
      const packagesCollection = getPackageCollection();

      // Find the selected delivery by ID
      const delivery = await deliveryLogCollection.findOne({
        _id: new ObjectId(selDeliveryId),
      });
      if (!delivery) {
        return { success: false, message: "Delivery not found." };
      }

      // Fetch details for material, and packaging
      const material = await materialsCollection.findOne({
        _id: new ObjectId(delivery.material),
      });
      const packaging = await packagesCollection.findOne({
        _id: new ObjectId(delivery.packaging),
      });

      // Replace the fields in the delivery object
      const updatedDelivery = {
        ...delivery,
        material: material ? material.materialName : null,
        packaging: packaging ? packaging.name : null,
      };

      return {
        success: true,
        message: "Success!",
        data: updatedDelivery,
      };
    } catch (e) {
      console.error("Error in getSelDelivery:", e);
      return { success: false, message: e.message };
    }
  };

  return {
    setReadDelivery,
    addDelivery,
    getLastestDelivery,
    getDeliverys,
    getSelDelivery,
    updateSelDelivery,
    addDeliveryFeedback,
    getDeliveryLogs,
    getSelDeliveryLog,
    getUserDeliverys,
    updateUserSelDelivery,
    getUserDeliveryLogs,
    getUserSelDeliveryLog,
  };
};

module.exports = deliveryCtrl();
