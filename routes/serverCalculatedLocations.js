// routes/serverCalculatedLocations.js
const express = require("express");
const router = express.Router();
const calculatedCountry = require("../models/calculatedCountries");
const calculatedRegion = require("../models/calculatedRegions");
const calculatedDivision = require("../models/calculatedDivisions");
const calculatedCity = require("../models/calculatedCities");
const rateLimiter = require("../middleware/rateLimiter");
const mongoose = require("mongoose");

router.use(rateLimiter);

// GET /api/calculatedLocations/countries?isActive=true
router.get("/countries", async (req, res) => {
  const { isActive } = req.query;
  const query = {};
  if (isActive !== undefined) query.active = isActive === "true";

  try {
    const countries = await calculatedCountry.find(query).sort({ countryName: 1 });
    res.status(200).json(countries);
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).json({ message: "Error fetching countries" });
  }
});

// GET /api/calculatedLocations/regions?countryId=&isActive=
router.get("/regions", async (req, res) => {
  const { countryId, isActive } = req.query;
  if (!countryId) {
    return res.status(400).json({ message: "countryId is required" });
  }

  const query = { calculatedCountryId: new mongoose.Types.ObjectId(countryId) };
  if (isActive !== undefined) query.active = isActive === "true";

  try {
    const regions = await calculatedRegion.find(query).sort({ regionName: 1 });
    res.status(200).json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    res.status(500).json({ message: "Error fetching regions" });
  }
});

// GET /api/calculatedLocations/divisions?regionId=&isActive=
router.get("/divisions", async (req, res) => {
  const { regionId, isActive } = req.query;
  if (!regionId) {
    return res.status(400).json({ message: "regionId is required" });
  }

  const query = { calculatedRegionId: new mongoose.Types.ObjectId(regionId) };
  if (isActive !== undefined) query.active = isActive === "true";

  try {
    const divisions = await calculatedDivision.find(query).sort({ divisionName: 1 });
    res.status(200).json(divisions);
  } catch (error) {
    console.error("Error fetching divisions:", error);
    res.status(500).json({ message: "Error fetching divisions" });
  }
});

// GET /api/calculatedLocations/cities?divisionId=&isActive=
router.get("/cities", async (req, res) => {
  const { divisionId, isActive } = req.query;
  if (!divisionId) {
    return res.status(400).json({ message: "divisionId is required" });
  }

  const query = { calculatedDivisionId: new mongoose.Types.ObjectId(divisionId) };
  if (isActive !== undefined) query.active = isActive === "true";

  try {
    const cities = await calculatedCity.find(query).sort({ cityName: 1 });
    res.status(200).json(cities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ message: "Error fetching cities" });
  }
});

module.exports = router;