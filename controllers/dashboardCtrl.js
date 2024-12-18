const { ObjectId } = require("mongodb");
const {
  getUserCollection,
  getSettingCollection,
  getDeliveryCollection,
  getDeliveryLogsCollection,
} = require("../helpers/db-conn");

const dashboardCtrl = () => {
  // Material Management
  const getDashboardLoyalty = async (userId) => {
    try {
      const usersCollection = getUserCollection();

      const selUser = await usersCollection.findOne({
        _id: new ObjectId(userId),
      });

      if (selUser) {
        const totalweight = selUser?.totalweight;
        const loyalty = selUser?.loyalty;
        let loyaltyVal = 0;

        const settingCollection = getSettingCollection();
        const settings = await settingCollection.findOne({});

        if (settings) {
          if (loyalty === 0) loyaltyVal = settings?.loyalty_bronze;
          else if (loyalty === 1) loyaltyVal = settings?.loyalty_silver;
          else if (loyalty >= 2) loyaltyVal = settings?.loyalty_golden;
        }

        return {
          success: true,
          data: {
            loyalty: loyalty,
            totalweight: totalweight,
            loyaltyVal: loyaltyVal,
          },
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
  const getDashboardWidget = async (userId) => {
    try {
      const usersCollection = getUserCollection();
      const deliveryCollection = getDeliveryCollection();
      const deliveryLogsCollection = getDeliveryLogsCollection();

      let totalWeight = 0;
      let totalDelivery = 0;
      let totalWaiting = 0;
      let totalAccepted = 0;

      // Get Total weight count
      const selUser = await usersCollection.findOne({
        _id: new ObjectId(userId),
      });
      if (selUser) {
        totalWeight = selUser?.totalweight;
      } else {
        return {
          success: false,
          message: "User not found.",
        };
      }

      // Get Total delivery count
      const selDeliveryCount = await deliveryLogsCollection.countDocuments({
        userId: userId,
      });
      if (selDeliveryCount) {
        totalDelivery = selDeliveryCount;
      }
      // Get Total accepted delivery count
      const selAcceptedDeliveryCount =
        await deliveryLogsCollection.countDocuments({
          userId: userId,
          status: 3,
        });
      if (selAcceptedDeliveryCount) {
        totalAccepted = selAcceptedDeliveryCount;
      }
      // Get Total waiting delivery count
      const selWaitingDeliveryCount = await deliveryCollection.countDocuments({
        userId: userId,
        status: 0,
      });
      if (selWaitingDeliveryCount) {
        totalWaiting = selWaitingDeliveryCount;
      }

      return {
        success: true,
        data: {
          totalWeight: totalWeight,
          totalDelivery: totalDelivery,
          totalWaiting: totalWaiting,
          totalAccepted: totalAccepted,
        },
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getDashboardDelivery = async (userId) => {
    try {
      const deliveryLogsCollection = getDeliveryLogsCollection();

      const currentYear = new Date().getFullYear();
      const deliveriesByMonth = await deliveryLogsCollection
        .aggregate([
          {
            $match: {
              userId: userId,
              status: 3,
              date: {
                $gte: `${currentYear}-01-01`,
                $lte: `${currentYear}-12-31`,
              },
            },
          },
          {
            $group: {
              _id: {
                month: { $month: { $dateFromString: { dateString: "$date" } } },
              },
              count: { $sum: 1 }, // Count the documents for each month
            },
          },
          {
            $sort: { "_id.month": 1 }, // Sort by month
          },
        ])
        .toArray();

      const response = Array(12)
        .fill(0)
        .map((_, index) => ({
          month: new Date(0, index).toLocaleString("default", {
            month: "long",
          }),
          count: 0,
        }));

      deliveriesByMonth.forEach((item) => {
        response[item._id.month - 1].count = item.count;
      });

      return { success: true, data: response };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getDashboardWeight = async (userId) => {
    try {
      const deliveryLogsCollection = getDeliveryLogsCollection();

      const currentYear = new Date().getFullYear();
      const deliveriesByMonth = await deliveryLogsCollection
        .aggregate([
          {
            $match: {
              userId: userId,
              status: 3,
              date: {
                $gte: `${currentYear}-01-01`,
                $lte: `${currentYear}-12-31`,
              },
            },
          },
          {
            $group: {
              _id: {
                month: { $month: { $dateFromString: { dateString: "$date" } } },
              },
              totalWeight: { $sum: "$weight" }, // Sum the weight for each month
            },
          },
          {
            $sort: { "_id.month": 1 }, // Sort by month
          },
        ])
        .toArray();

      const response = Array(12)
        .fill(0)
        .map((_, index) => ({
          month: new Date(0, index).toLocaleString("default", {
            month: "long",
          }),
          totalWeight: 0,
        }));

      deliveriesByMonth.forEach((item) => {
        response[item._id.month - 1].totalWeight = item.totalWeight;
      });

      return { success: true, data: response };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getAdminDashboardWidget = async () => {
    try {
      const usersCollection = getUserCollection();
      const deliveryCollection = getDeliveryCollection();
      const deliveryLogsCollection = getDeliveryLogsCollection();

      let totalSupplier = 0;
      let totalWeight = 0;
      let totalWaiting = 0;
      let totalAccepted = 0;

      // Get total suppliers count
      totalSupplier = await usersCollection.countDocuments();
      // Get total weight
      const totalWeightData = await usersCollection
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: "$totalweight" }, // Summing up the totalweight field
            },
          },
        ])
        .toArray();
      if (totalWeightData) {
        totalWeight = totalWeightData[0]?.total;
      }
      // Get total waiting count
      const selWaitingDeliveryCount = await deliveryCollection.countDocuments({
        status: 0,
      });
      if (selWaitingDeliveryCount) {
        totalWaiting = selWaitingDeliveryCount;
      }
      // Get Total accepted delivery count
      const selAcceptedDeliveryCount =
        await deliveryLogsCollection.countDocuments({
          status: 3,
        });
      if (selAcceptedDeliveryCount) {
        totalAccepted = selAcceptedDeliveryCount;
      }

      return {
        success: true,
        data: {
          totalSupplier: totalSupplier,
          totalWeight: totalWeight,
          totalWaiting: totalWaiting,
          totalAccepted: totalAccepted,
        },
      };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getAdminDashboardDelivery = async () => {
    try {
      const deliveryLogsCollection = getDeliveryLogsCollection();

      const currentYear = new Date().getFullYear();
      const deliveriesByMonth = await deliveryLogsCollection
        .aggregate([
          {
            $match: {
              status: 3,
              date: {
                $gte: `${currentYear}-01-01`,
                $lte: `${currentYear}-12-31`,
              },
            },
          },
          {
            $group: {
              _id: {
                month: { $month: { $dateFromString: { dateString: "$date" } } },
              },
              count: { $sum: 1 }, // Count the documents for each month
            },
          },
          {
            $sort: { "_id.month": 1 }, // Sort by month
          },
        ])
        .toArray();

      const response = Array(12)
        .fill(0)
        .map((_, index) => ({
          month: new Date(0, index).toLocaleString("default", {
            month: "long",
          }),
          count: 0,
        }));

      deliveriesByMonth.forEach((item) => {
        response[item._id.month - 1].count = item.count;
      });

      return { success: true, data: response };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getAdminDashboardWeight = async () => {
    try {
      const deliveryLogsCollection = getDeliveryLogsCollection();

      const currentYear = new Date().getFullYear();
      const deliveriesByMonth = await deliveryLogsCollection
        .aggregate([
          {
            $match: {
              status: 3,
              date: {
                $gte: `${currentYear}-01-01`,
                $lte: `${currentYear}-12-31`,
              },
            },
          },
          {
            $group: {
              _id: {
                month: { $month: { $dateFromString: { dateString: "$date" } } },
              },
              totalWeight: { $sum: "$weight" }, // Sum the weight for each month
            },
          },
          {
            $sort: { "_id.month": 1 }, // Sort by month
          },
        ])
        .toArray();

      const response = Array(12)
        .fill(0)
        .map((_, index) => ({
          month: new Date(0, index).toLocaleString("default", {
            month: "long",
          }),
          totalWeight: 0,
        }));

      deliveriesByMonth.forEach((item) => {
        response[item._id.month - 1].totalWeight = item.totalWeight;
      });

      return { success: true, data: response };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };
  const getAdminDashboardLoyalty = async () => {
    try {
      const usersCollection = getUserCollection();

      const loyaltyCounts = await usersCollection
        .aggregate([
          {
            $match: { loyalty: { $gte: 0, $lte: 3 } }, // Filter documents with loyalty between 0 and 3
          },
          {
            $group: {
              _id: "$loyalty", // Group by the loyalty value
              count: { $sum: 1 }, // Count documents in each group
            },
          },
        ])
        .toArray();

      const result = { 0: 0, 1: 0, 2: 0, 3: 0 };
      loyaltyCounts.forEach((item) => {
        result[item._id] = item.count;
      });

      return { success: true, data: result };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  return {
    getDashboardLoyalty,
    getDashboardWidget,
    getDashboardDelivery,
    getDashboardWeight,
    getAdminDashboardWidget,
    getAdminDashboardDelivery,
    getAdminDashboardWeight,
    getAdminDashboardLoyalty,
  };
};

module.exports = dashboardCtrl();
