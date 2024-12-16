const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { connectToDatabase } = require("./helpers/db-conn");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use("/api", routes);

connectToDatabase();

// Start the Express server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});
