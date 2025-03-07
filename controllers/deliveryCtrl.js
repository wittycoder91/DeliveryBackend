const axios = require("axios");
const { ObjectId, Double, Int32 } = require("mongodb");
const {
  getDeliveryCollection,
  getUserCollection,
  getMaterialCollection,
  getPackageCollection,
  getQualityCollection,
  getDeliveryLogsCollection,
  getSettingCollection,
  getDeliveryColorsCollection,
  getDeliveryResiduesCollection,
  getDeliveryConditionsCollection,
} = require("../helpers/db-conn");
const Mailjet = require("node-mailjet");

const { formatTime } = require("../config/common");

const mailjetClient = Mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

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
    other,
    note,
    avatarPath,
    sdsPath
  ) => {
    const collection = getDeliveryCollection();
    const collectionLogs = getDeliveryLogsCollection();
    const collectionUser = getUserCollection();
    const collectionMaterial = getMaterialCollection();
    const collectionPackage = getPackageCollection();
    let curStatus = 0;
    let currentMaxPo = 0;
    let curPrice = 0;

    // Searches the database for a user with the same userId.
    const selUser = await collectionUser.findOne({ _id: new ObjectId(userId) });
    if (selUser) {
      if (selUser?.trust === 1) {
        curStatus = 1;
        curPrice = selUser?.price;

        const latestDelivery = await collection
          .find()
          .sort({ po: -1 })
          .limit(1)
          .toArray();

        const currentYear = new Date().getFullYear();
        const yearLastTwoDigits = currentYear % 100;
        const defaultPo = yearLastTwoDigits * 1000 + 1;

        if (latestDelivery.length > 0) {
          currentMaxPo = latestDelivery[0]?.po;
        }

        const latestLogsDelivery = await collectionLogs
          .find()
          .sort({ po: -1 })
          .limit(1)
          .toArray();
        if (latestLogsDelivery.length > 0) {
          let logMaxPo = latestLogsDelivery[0]?.po;
          if (currentMaxPo < logMaxPo) {
            currentMaxPo = logMaxPo;
          }
        }

        if (currentMaxPo === 0) {
          currentMaxPo = defaultPo;
        } else {
          if (currentMaxPo < defaultPo) {
            currentMaxPo = defaultPo;
          } else {
            currentMaxPo = currentMaxPo + 1;
          }
        }
      }
    }

    const deliveryExist = await collection.findOne({
      date: date,
      time: parseInt(time, 10),
    });
    if (deliveryExist) {
      return { success: false, message: "You can not deliver at that time." };
    } else {
      const delivery = await collection.insertOne({
        userId,
        po: currentMaxPo,
        material,
        weight: parseFloat(weight),
        packaging,
        countpackage: parseInt(countpackage, 10),
        color,
        residue,
        condition,
        status: curStatus,
        price: curPrice,
        date,
        time: parseInt(time, 10),
        other,
        note,
        avatarPath,
        sdsPath,
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

        // Send Email
        if (selUser?.email) {
          await mailjetClient.post("send", { version: "v3.1" }).request({
            Messages: [
              {
                From: {
                  Email: "elias@holamicasa.com",
                  Name: "Archpolymers",
                },
                To: [
                  {
                    Email: selUser?.email,
                    Name: "",
                  },
                ],
                Subject: "Delivery Add",
                TextPart: `${selUser?.name} sent a delivery request`,
              },
            ],
          });
        }

        return {
          success: true,
          message: "The delivery request added successfully",
        };
      } else {
        return { success: false, message: "MongoDB API error" };
      }
    }
  };
  const getLastestDelivery = async (userId) => {
    try {
      const collection = getDeliveryCollection();
      const loggCollection = getDeliveryLogsCollection();

      const latestDelivery = await collection
        .find({ userId })
        .sort({ _id: -1 })
        .limit(1)
        .toArray();

      if (latestDelivery && latestDelivery.length > 0) {
        return { success: true, data: latestDelivery[0] };
      } else {
        const latestLogDelivery = await loggCollection
          .find({ userId })
          .sort({ _id: -1 })
          .limit(1)
          .toArray();

        if (latestLogDelivery && latestLogDelivery.length > 0) {
          return { success: true, data: latestLogDelivery[0] };
        } else {
          return { success: false, message: "No deliveries found" };
        }
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
              colorId: { $toObjectId: "$color" },
              residueId: { $toObjectId: "$residue" },
              conditionId: { $toObjectId: "$condition" },
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
            $lookup: {
              from: "colors", // Join with colors collection
              localField: "colorId",
              foreignField: "_id",
              as: "colorDetails",
            },
          },
          {
            $lookup: {
              from: "residues", // Join with residues collection
              localField: "residueId",
              foreignField: "_id",
              as: "residueDetails",
            },
          },
          {
            $lookup: {
              from: "conditions", // Join with conditions collection
              localField: "conditionId",
              foreignField: "_id",
              as: "conditionDetails",
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
              colorName: {
                $arrayElemAt: ["$colorDetails.colorName", 0],
              },
              residueName: {
                $arrayElemAt: ["$residueDetails.residueName", 0],
              },
              conditionName: {
                $arrayElemAt: ["$conditionDetails.conditionName", 0],
              },
            },
          },
          {
            $unset: [
              "userDetails",
              "materialDetails",
              "packageDetails",
              "colorDetails",
              "residueDetails",
              "conditionDetails",
              "userSelId",
              "materialId",
              "packageId",
              "colorId",
              "residueId",
              "conditionId",
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
      const colorsCollection = getDeliveryColorsCollection();
      const residuesCollection = getDeliveryResiduesCollection();
      const conditionsCollection = getDeliveryConditionsCollection();

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
      const color = await colorsCollection.findOne({
        _id: new ObjectId(delivery.color),
      });
      const residue = await residuesCollection.findOne({
        _id: new ObjectId(delivery.residue),
      });
      const condition = await conditionsCollection.findOne({
        _id: new ObjectId(delivery.condition),
      });

      // Replace the fields in the delivery object
      const updatedDelivery = {
        ...delivery,
        username: user ? user.name : null,
        material: material ? material.materialName : null,
        packaging: packaging ? packaging.name : null,
        color: color ? color.colorName : null,
        residue: residue ? residue.residueName : null,
        condition: condition ? condition.conditionName : null,
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
  const updateSelDelivery = async (selDeliveryId, status, price) => {
    try {
      const collection = getDeliveryCollection();
      const collectionLogs = getDeliveryLogsCollection();
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
        let currentMaxPo = 0;
        if (status === 0) {
          const latestDelivery = await collection
            .find()
            .sort({ po: -1 })
            .limit(1)
            .toArray();

          const currentYear = new Date().getFullYear();
          const yearLastTwoDigits = currentYear % 100;
          const defaultPo = yearLastTwoDigits * 1000 + 1;

          if (latestDelivery.length > 0) {
            currentMaxPo = latestDelivery[0]?.po;
          }

          const latestLogsDelivery = await collectionLogs
            .find()
            .sort({ po: -1 })
            .limit(1)
            .toArray();
          if (latestLogsDelivery.length > 0) {
            let logMaxPo = latestLogsDelivery[0]?.po;
            if (currentMaxPo < logMaxPo) {
              currentMaxPo = logMaxPo;
            }
          }

          if (currentMaxPo === 0) {
            currentMaxPo = defaultPo;
          } else {
            if (currentMaxPo < defaultPo) {
              currentMaxPo = defaultPo;
            } else {
              currentMaxPo = currentMaxPo + 1;
            }
          }
        }

        // Build the update object dynamically
        const updateFields = { status: status + 1 };
        if (currentMaxPo > 0) {
          updateFields.po = currentMaxPo;
        }

        if (price > 0) {
          updateFields.price = new Double(parseFloat(price));
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

        // Send Email
        if (updateData) {
          let emailContent = "";
          if (status === 0) {
            emailContent = `${user?.name} status has been updated from 'Waiting' to 'Pending for Receiving'`;
          } else if (status === 1) {
            emailContent = `${user?.name} status has been updated from 'Pending for Receiving' to 'Received'`;
          }
          await mailjetClient.post("send", { version: "v3.1" }).request({
            Messages: [
              {
                From: {
                  Email: "elias@holamicasa.com",
                  Name: "Archpolymers",
                },
                To: [
                  {
                    Email: user?.email,
                    Name: "",
                  },
                ],
                Subject: "Delivery Status",
                TextPart: emailContent,
              },
            ],
          });
        }

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
    status,
    totalamount,
    tareamount,
    quality,
    pkgscount,
    package,
    insepction,
    feedback,
    feedbackImage
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
        selData.status = parseInt(status) + 1;

        let selUserId = selData.userId;
        let curTotalWeight = 0;

        const selUserData = await usersCollection.findOne({
          _id: new ObjectId(selUserId),
        });
        if (selUserData) {
          curTotalWeight = selUserData.totalweight;
        }
        curTotalWeight = parseFloat(totalamount) + parseFloat(curTotalWeight);
        curTotalWeight = parseFloat(curTotalWeight).toFixed(2);

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
        dataWithoutId.weight = new Double(parseFloat(totalamount).toFixed(2));
        dataWithoutId.tareamount = new Double(
          parseFloat(tareamount).toFixed(2)
        );
        const netamount =
          new Double(parseFloat(totalamount).toFixed(2)) -
          new Double(parseFloat(tareamount).toFixed(2));
        dataWithoutId.netamount = netamount;
        dataWithoutId.quality = quality;
        dataWithoutId.countpackage = new Int32(pkgscount);
        dataWithoutId.packaging = package;
        dataWithoutId.insepction = insepction;
        dataWithoutId.feedback = feedback;
        dataWithoutId.feedbackImage = feedbackImage;

        // // Update the user collection and return the updated data
        const updateFields = {
          totalweight: new Double(parseFloat(curTotalWeight)),
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
          message: "A new delivery log has been added",
          count: 1,
          delieryData: updatedDelivery,
        });

        // Send Email
        if (user) {
          await mailjetClient.post("send", { version: "v3.1" }).request({
            Messages: [
              {
                From: {
                  Email: "elias@holamicasa.com",
                  Name: "Archpolymers",
                },
                To: [
                  {
                    Email: user?.email,
                    Name: "",
                  },
                ],
                Subject: "Delivery Status",
                TextPart: `${user?.name}'s delivery has been successfully accepted`,
              },
            ],
          });
        }

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
  const addRejectDelivery = async (selID, reason, uploadedFilePaths) => {
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
        // Remove the delivery data
        await collection.deleteOne({
          _id: new ObjectId(selID),
        });

        const { _id, ...dataWithoutId } = selData;
        dataWithoutId.status = -1;
        dataWithoutId.feedback = reason;
        dataWithoutId.rejectImages = uploadedFilePaths;

        // Insert the data to the deliverylogs collection
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
          message: "A new delivery log has been added",
          count: 1,
          delieryData: updatedDelivery,
        });

        // Send Email
        if (updateData) {
          await mailjetClient.post("send", { version: "v3.1" }).request({
            Messages: [
              {
                From: {
                  Email: "elias@holamicasa.com",
                  Name: "Archpolymers",
                },
                To: [
                  {
                    Email: user?.email,
                    Name: "",
                  },
                ],
                Subject: "Delivery Status",
                TextPart: `${user?.name}'s delivery was disapproved`,
              },
            ],
          });
        }

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
              qualityId: { $toObjectId: "$quality" },
              colorId: { $toObjectId: "$color" },
              residueId: { $toObjectId: "$residue" },
              conditionId: { $toObjectId: "$condition" },
            },
          },
          {
            $lookup: {
              from: "materials",
              localField: "materialId",
              foreignField: "_id",
              as: "materialDetails",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userSelId",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $lookup: {
              from: "packages",
              localField: "packageId",
              foreignField: "_id",
              as: "packageDetails",
            },
          },
          {
            $lookup: {
              from: "qualitys",
              localField: "qualityId",
              foreignField: "_id",
              as: "qualityDetails",
            },
          },
          {
            $lookup: {
              from: "colors", // Join with colors collection
              localField: "colorId",
              foreignField: "_id",
              as: "colorDetails",
            },
          },
          {
            $lookup: {
              from: "residues", // Join with residues collection
              localField: "residueId",
              foreignField: "_id",
              as: "residueDetails",
            },
          },
          {
            $lookup: {
              from: "conditions", // Join with conditions collection
              localField: "conditionId",
              foreignField: "_id",
              as: "conditionDetails",
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
              qualityName: {
                $arrayElemAt: ["$qualityDetails.name", 0],
              },
              colorName: {
                $arrayElemAt: ["$colorDetails.colorName", 0],
              },
              residueName: {
                $arrayElemAt: ["$residueDetails.residueName", 0],
              },
              conditionName: {
                $arrayElemAt: ["$conditionDetails.conditionName", 0],
              },
            },
          },
          {
            $unset: [
              "userDetails",
              "materialDetails",
              "packageDetails",
              "qualityDetails",
              "colorDetails",
              "residueDetails",
              "conditionDetails",
              "userSelId",
              "materialId",
              "packageId",
              "qualityId",
              "colorId",
              "residueId",
              "conditionId",
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
      const qualityCollection = getQualityCollection();
      const packagesCollection = getPackageCollection();
      const colorsCollection = getDeliveryColorsCollection();
      const residuesCollection = getDeliveryResiduesCollection();
      const conditionsCollection = getDeliveryConditionsCollection();

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
      const quality = await qualityCollection.findOne({
        _id: new ObjectId(delivery.quality),
      });
      const color = await colorsCollection.findOne({
        _id: new ObjectId(delivery.color),
      });
      const residue = await residuesCollection.findOne({
        _id: new ObjectId(delivery.residue),
      });
      const condition = await conditionsCollection.findOne({
        _id: new ObjectId(delivery.condition),
      });

      // Replace the fields in the delivery object
      const updatedDelivery = {
        ...delivery,
        username: user ? user.name : null,
        material: material ? material.materialName : null,
        packaging: packaging ? packaging.name : null,
        quality: quality ? quality.name : null,
        color: color ? color.colorName : null,
        residue: residue ? residue.residueName : null,
        condition: condition ? condition.conditionName : null,
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
              colorId: { $toObjectId: "$color" },
              residueId: { $toObjectId: "$residue" },
              conditionId: { $toObjectId: "$condition" },
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
            $lookup: {
              from: "colors", // Join with colors collection
              localField: "colorId",
              foreignField: "_id",
              as: "colorDetails",
            },
          },
          {
            $lookup: {
              from: "residues", // Join with residues collection
              localField: "residueId",
              foreignField: "_id",
              as: "residueDetails",
            },
          },
          {
            $lookup: {
              from: "conditions", // Join with conditions collection
              localField: "conditionId",
              foreignField: "_id",
              as: "conditionDetails",
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
              colorName: {
                $arrayElemAt: ["$colorDetails.colorName", 0],
              },
              residueName: {
                $arrayElemAt: ["$residueDetails.residueName", 0],
              },
              conditionName: {
                $arrayElemAt: ["$conditionDetails.conditionName", 0],
              },
            },
          },
          {
            $unset: [
              "materialDetails",
              "packageDetails",
              "colorDetails",
              "residueDetails",
              "conditionDetails",
              "materialId",
              "packageId",
              "colorId",
              "residueId",
              "conditionId",
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

      let userName = "";
      let userEmail = "";
      const oldDeliveryData = await collection.findOne({
        _id: new ObjectId(selDeliveryId),
      });

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
            userName = user ? user.name : "";
            userEmail = user?.email;

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

        // Send Email
        if (oldDeliveryData && userEmail && userName) {
          await mailjetClient.post("send", { version: "v3.1" }).request({
            Messages: [
              {
                From: {
                  Email: "elias@holamicasa.com",
                  Name: "Archpolymers",
                },
                To: [
                  {
                    Email: userEmail,
                    Name: "",
                  },
                ],
                Subject: "Delivery Request Update",
                TextPart: `${userName} has updated the date and time as ${
                  oldDeliveryData?.date
                }, ${formatTime(
                  parseInt(oldDeliveryData?.time)
                )} to ${updateDate}, ${formatTime(parseInt(updateTime))}`,
              },
            ],
          });
        }

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
              qualityId: { $toObjectId: "$quality" },
              colorId: { $toObjectId: "$color" },
              residueId: { $toObjectId: "$residue" },
              conditionId: { $toObjectId: "$condition" },
            },
          },
          {
            $lookup: {
              from: "materials",
              localField: "materialId",
              foreignField: "_id",
              as: "materialDetails",
            },
          },
          {
            $lookup: {
              from: "packages",
              localField: "packageId",
              foreignField: "_id",
              as: "packageDetails",
            },
          },
          {
            $lookup: {
              from: "qualitys",
              localField: "qualityId",
              foreignField: "_id",
              as: "qualityDetails",
            },
          },
          {
            $lookup: {
              from: "colors", // Join with colors collection
              localField: "colorId",
              foreignField: "_id",
              as: "colorDetails",
            },
          },
          {
            $lookup: {
              from: "residues", // Join with residues collection
              localField: "residueId",
              foreignField: "_id",
              as: "residueDetails",
            },
          },
          {
            $lookup: {
              from: "conditions", // Join with conditions collection
              localField: "conditionId",
              foreignField: "_id",
              as: "conditionDetails",
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
              qualityName: {
                $arrayElemAt: ["$qualityDetails.name", 0],
              },
              colorName: {
                $arrayElemAt: ["$colorDetails.colorName", 0],
              },
              residueName: {
                $arrayElemAt: ["$residueDetails.residueName", 0],
              },
              conditionName: {
                $arrayElemAt: ["$conditionDetails.conditionName", 0],
              },
            },
          },
          {
            $unset: [
              "userDetails",
              "materialDetails",
              "packageDetails",
              "qualityDetails",
              "colorDetails",
              "residueDetails",
              "conditionDetails",
              "userSelId",
              "materialId",
              "packageId",
              "qualityId",
              "colorId",
              "residueId",
              "conditionId",
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
      const qualityCollection = getQualityCollection();
      const colorsCollection = getDeliveryColorsCollection();
      const residuesCollection = getDeliveryResiduesCollection();
      const conditionsCollection = getDeliveryConditionsCollection();

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
      const quality = await qualityCollection.findOne({
        _id: new ObjectId(delivery.quality),
      });
      const color = await colorsCollection.findOne({
        _id: new ObjectId(delivery.color),
      });
      const residue = await residuesCollection.findOne({
        _id: new ObjectId(delivery.residue),
      });
      const condition = await conditionsCollection.findOne({
        _id: new ObjectId(delivery.condition),
      });

      // Replace the fields in the delivery object
      const updatedDelivery = {
        ...delivery,
        material: material ? material.materialName : null,
        packaging: packaging ? packaging.name : null,
        quality: quality ? quality.name : null,
        color: color ? color.colorName : null,
        residue: residue ? residue.residueName : null,
        condition: condition ? condition.conditionName : null,
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
    addRejectDelivery,
    getDeliveryLogs,
    getSelDeliveryLog,
    getUserDeliverys,
    updateUserSelDelivery,
    getUserDeliveryLogs,
    getUserSelDeliveryLog,
  };
};

module.exports = deliveryCtrl();
