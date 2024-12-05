const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env

const CalculatedCountries = require("../../models/calculatedCountries");
const CalculatedRegions =   require("../../models/calculatedRegions");
const CalculatedDivisions = require("../../models/calculatedDivsions");
const CalculatedCities = require("../../models/calculatedCites");

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

const masterDataPath = path.join(__dirname, "../../masterdata");


async function connectToMongoDB() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoURI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });
  console.log("MongoDB connected");
}

async function loadCalculatedData() {
  try {
    // Clear existing data
    await CalculatedCountries.deleteMany({});
    await CalculatedRegions.deleteMany({});
    await CalculatedDivisions.deleteMany({});
    await CalculatedCities.deleteMany({});
    console.log("Existing calculated data removed");

    // Load master data
    const countriesData = JSON.parse(
      fs.readFileSync(
        path.join(masterDataPath, "calculatedCountries.json"),
        "utf-8",
      )
    );
    const regionsData = JSON.parse(
      fs.readFileSync(path.join(masterDataPath, "calculatedRegions.json"), "utf-8")
    );
    const divisionsData = JSON.parse(
      fs.readFileSync(
        path.join(masterDataPath, "calculatedDivisions.json"),
        "utf-8",
      )
    );
    const citiesData = JSON.parse(
      fs.readFileSync(path.join(masterDataPath, "calculatedCities.json"), "utf-8")
    );

    // Insert new data
    await CalculatedCountries.insertMany(countriesData);
    console.log("New countries inserted");

    await CalculatedRegions.insertMany(regionsData);
    console.log("New regions inserted");

    await CalculatedDivisions.insertMany(divisionsData);
    console.log("New divisions inserted");

    await CalculatedCities.insertMany(citiesData);
    console.log("New cities inserted");

    // Close connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error loading calculated data:", error);
    process.exit(1);
  }
}

(async function main() {
  await connectToMongoDB();
  await loadCalculatedData();
})();