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
getIndustryCollection = () => {
  return db.collection("industry");
};
getColorCollection = () => {
  return db.collection("colors");
};
getResidueCollection = () => {
  return db.collection("residues");
};
getConditionCollection = () => {
  return db.collection("conditions");
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
getQualityCollection = () => {
  return db.collection("qualitys");
};
getDeliveryCollection = () => {
  return db.collection("deliverys");
};
getDeliveryLogsCollection = () => {
  return db.collection("deliverylogs");
};
getDeliveryColorsCollection = () => {
  return db.collection("colors");
};
getDeliveryResiduesCollection = () => {
  return db.collection("residues");
};
getDeliveryConditionsCollection = () => {
  return db.collection("conditions");
};

module.exports = {
  getDb,
  connectToDatabase,
  getUserCollection,
  getAdminCollection,
  getMaterialCollection,
  getIndustryCollection,
  getColorCollection,
  getResidueCollection,
  getConditionCollection,
  getSettingCollection,
  getFAQCollection,
  getPackageCollection,
  getQualityCollection,
  getDeliveryCollection,
  getDeliveryLogsCollection,
  getDeliveryColorsCollection,
  getDeliveryResiduesCollection,
  getDeliveryConditionsCollection,
};
