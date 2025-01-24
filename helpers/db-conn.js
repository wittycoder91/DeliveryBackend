const { MongoClient } = require("mongodb");
// const mongodbUri = "mongodb://localhost:27017/";
const mongodbUri = "mongodb://deluser:password@localhost:27017/";
const client = new MongoClient(mongodbUri);
let db;

const connectToDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB");

    // Verify connection and initialize the database
    db = client.db("delivery");
    if (!db) {
      throw new Error(
        "Database 'delivery' is undefined. Check the database name."
      );
    }
    console.log("Database selected:", db.databaseName);

    const collections = {
      admins: [
        {
          userid: "admin",
          password:
            "$2a$10$D54hxd3YjSbR0z9DiPv6yefcOdh5RW94xNfRjKRIlfYNS1Vg/42oS",
        },
      ],
      industry: [
        {
          industryName: "IT",
          industryDesc: "Information technology",
          note: "",
        },
        {
          industryName: "Education",
          industryDesc: "Education Description",
          note: "",
        },
        {
          industryName: "Health",
          industryDesc: "Health Description",
          note: "",
        },
      ],
      materials: [
        {
          materialName: "material1",
          materialDesc: "material description 1",
          note: "12",
        },
        {
          materialName: "material2",
          materialDesc: "material description 2",
          note: "note123",
        },
      ],
      packages: [
        { name: "Baled" },
        { name: "Stacked on Skids" },
        { name: "Loosed in Boxes" },
      ],
      qualitys: [
        { name: "A" },
        { name: "B" },
        { name: "C" },
        { name: "D" },
      ],
      residues: [
        { residueName: "Food Product", residueDesc: "Description 1", note: "" },
        {
          residueName: "Non-hazardous Powder (SDS)",
          residueDesc: "Description 2",
          note: "",
        },
        {
          residueName: "Plastic Granules",
          residueDesc: "Description 3",
          note: "",
        },
        { residueName: "Unknown", residueDesc: "Description 4", note: "" },
        { residueName: "Other", residueDesc: "Description 5", note: "" },
      ],
      settings: [
        {
          firsttime: 300,
          fourthtime: 8310,
          loyalty_bronze: 200,
          loyalty_gold: 1000,
          loyalty_silver: 50,
          secondtime: 1200,
          thirdtime: 2400,
          address: "address",
          city: "city",
          state: "state",
          telephone: "telephone",
          zipcode: "zipcode",
          report: "report",
          terms: "terms",
          loyalty_bronze_benefit: "",
          loyalty_golden_benefit: "",
          loyalty_silver_benefit: "",
        },
      ],
    };

    // Check and create collections
    for (const [collectionName, initialData] of Object.entries(collections)) {
      const collectionExists = await db
        .listCollections({ name: collectionName })
        .hasNext();

      if (!collectionExists) {
        console.log(`Creating collection: ${collectionName}`);
        const collection = db.collection(collectionName);
        await collection.insertMany(initialData);
        console.log(`Inserted initial data into ${collectionName}`);
      } else {
        console.log(`Collection ${collectionName} already exists`);
      }
    }

    console.log("Database setup completed");
  } catch (e) {
    console.error("Error connecting to MongoDB:", e);
  } finally {
    if (client) {
      await client.dis;
      console.log("MongoDB connection closed");
    }
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
getDateCollection = () => {
  return db.collection("dates");
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
  getDateCollection,
};
