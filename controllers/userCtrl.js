const { getUserCollection } = require("../helpers/db-conn");
const mailData = require("dotenv").config();

const UserCtrl = () => {
  // Manage User
  const getSelUserInfor = async (selEmail) => {
    try {
      const collection = getUserCollection();

      const data = await collection.find({ email: selEmail }).toArray();
      return { success: true, message: "Success!", data: data };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  return {
    getSelUserInfor,
  };
};

module.exports = UserCtrl();
