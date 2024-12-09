const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env

const MasteredCountries = require("../../models/masteredCountries");
const MasteredRegions = require("../../models/masteredRegions");
const MasteredDivisions = require("../../models/masteredDivisions");
const MasteredCities = require("../../models/masteredCities");

const mongoURI = process.env.MONGODB_URI; // Ensure this matches your .env file

const masterDataPath = path.resolve(__dirname, "../../masterdata");

async function connectToMongoDB() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
}

async function clearExistingData() {
  try {
    console.log("Clearing existing calculated data...");
    await Promise.all([
      MasteredRegions.deleteMany({}),
      MasteredDivisions.deleteMany({}),
      MasteredCities.deleteMany({}),
    ]);
    console.log("Existing data cleared successfully");
  } catch (err) {
    console.error("Error clearing data:", err);
    throw err;
  }
}

async function getCountryId() {
  try {
    const country = await MasteredCountries.findOne({
      countryName: "United States",
    });
    if (!country) {
      throw new Error(
        "United States not found in MasteredCountries collection.",
      );
    }
    return country._id;
  } catch (err) {
    console.error("Error fetching United States country ID:", err);
    throw err;
  }
}

function loadJSONFile(fileName) {
  try {
    const filePath = path.join(masterDataPath, fileName);
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading or parsing file: ${fileName}`, err);
    throw err;
  }
}

async function insertRegions(regionData, countryId) {
  const regions = regionData.map((region) => ({
    regionName: region.regionName,
    regionCode: region.regionCode,
    active: region.active,
    masteredCountryId: countryId,
  }));
  return await MasteredRegions.insertMany(regions);
}

async function insertDivisions(regionData, regionsMap) {
  const divisions = regionData.flatMap((region) =>
    region.divisions.map((division) => ({
      divisionName: division.divisionName,
      divisionCode: division.divisionCode,
      active: division.active,
      states: division.states,
      masteredRegionId: regionsMap[region.regionCode],
    })),
  );
  return await MasteredDivisions.insertMany(divisions);
}

async function insertCities(regionData, divisionsMap) {
  const cities = regionData.flatMap((region) =>
    region.divisions.flatMap((division) =>
      division.majorCities.map((city) => ({
        cityName: city.cityName,
        cityCode: city.cityCode,
        latitude: city.latitude,
        longitude: city.longitude,
        location: {
          type: "Point",
          coordinates: [city.longitude, city.latitude],
        },
        active: city.active,
        masteredDivisionId: divisionsMap[division.divisionCode],
      })),
    ),
  );
  return await MasteredCities.insertMany(cities);
}

async function loadCalculatedData() {
  try {
    const countryId = await getCountryId();

    // Load master data
    const regionData = loadJSONFile("fullerRegDevCitActive.json").regions;

    // Insert regions
    const insertedRegions = await insertRegions(regionData, countryId);
    const regionsMap = Object.fromEntries(
      insertedRegions.map((region) => [region.regionCode, region._id]),
    );

    // Insert divisions
    const insertedDivisions = await insertDivisions(regionData, regionsMap);
    const divisionsMap = Object.fromEntries(
      insertedDivisions.map((division) => [
        division.divisionCode,
        division._id,
      ]),
    );

    // Insert cities
    await insertCities(regionData, divisionsMap);

    console.log("All data inserted successfully");
  } catch (err) {
    console.error("Error loading calculated data:", err);
    throw err;
  }
}

(async function main() {
  try {
    await connectToMongoDB();
    await clearExistingData();
    await loadCalculatedData();
  } catch (err) {
    console.error("Process failed:", err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
})();
