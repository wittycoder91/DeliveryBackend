const { MongoClient } = require("mongodb");
const mongodbUri = "mongodb://localhost:27017/";
const client = new MongoClient(mongodbUri);
let db;

connectToDatabase = async () => {
  try {
    await client.connect();
    db = client.db("delivery");
    console.log("Connected to MongoDB");
  } catch (e) {
    console.error(e);
  } finally {
    await client.dis;
  }
};

getDb = () => {
  return db;
};

getUserCollection = () => {
  return db.collection("users");
};
getAdminCollection = () => {
  return db.collection("admins");
};
getMaterialCollection = () => {
  return db.collection("materials");
};
getSettingCollection = () => {
  return db.collection("settings");
};
getFAQCollection = () => {
  return db.collection("faqs");
};
getPackageCollection = () => {
  return db.collection("packages");
};
getDeliveryCollection = () => {
  return db.collection("deliverys");
};
getDeliveryLogsCollection = () => {
  return db.collection("deliverylogs");
};

module.exports = {
  getDb,
  connectToDatabase,
  getUserCollection,
  getAdminCollection,
  getMaterialCollection,
  getSettingCollection,
  getFAQCollection,
  getPackageCollection,
  getDeliveryCollection,
  getDeliveryLogsCollection,
};
