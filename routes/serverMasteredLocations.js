// routes/serverMasteredLocations.js
const express = require("express");
const router = express.Router();
const masteredCountry = require("../models/masteredCountries");
const masteredRegion = require("../models/masteredRegions");
const masteredDivision = require("../models/masteredDivisions");
const masteredCity = require("../models/masteredCities");
const rateLimiter = require("../middleware/rateLimiter");
const mongoose = require("mongoose");

router.use(rateLimiter);

// GET /api/masteredLocations/countries?isActive=true
router.get("/countries", async (req, res) => {
  const { isActive } = req.query;
  const query = {};
  if (isActive !== undefined) query.active = isActive === "true";

  try {
    const countries = await masteredCountry.find(query).sort({ countryName: 1 });
    res.status(200).json(countries);
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).json({ message: "Error fetching countries" });
  }
});

// GET /api/masteredLocations/regions?countryId=&isActive=
router.get("/regions", async (req, res) => {
  const { countryId, isActive } = req.query;
  if (!countryId) {
    return res.status(400).json({ message: "countryId is required" });
  }

  const query = { masteredCountryId: new mongoose.Types.ObjectId(countryId) };
  if (isActive !== undefined) query.active = isActive === "true";

  try {
    const regions = await masteredRegion.find(query).sort({ regionName: 1 });
    res.status(200).json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    res.status(500).json({ message: "Error fetching regions" });
  }
});

// GET /api/masteredLocations/divisions?regionId=&isActive=
router.get("/divisions", async (req, res) => {
  const { regionId, isActive } = req.query;
  if (!regionId) {
    return res.status(400).json({ message: "regionId is required" });
  }

  const query = { masteredRegionId: new mongoose.Types.ObjectId(regionId) };
  if (isActive !== undefined) query.active = isActive === "true";

  try {
    const divisions = await masteredDivision.find(query).sort({ divisionName: 1 });
    res.status(200).json(divisions);
  } catch (error) {
    console.error("Error fetching divisions:", error);
    res.status(500).json({ message: "Error fetching divisions" });
  }
});

// GET /api/masteredLocations/cities?divisionId=&isActive=
router.get("/cities", async (req, res) => {
  const { divisionId, isActive } = req.query;
  if (!divisionId) {
    return res.status(400).json({ message: "divisionId is required" });
  }

  const query = { masteredDivisionId: new mongoose.Types.ObjectId(divisionId) };
  if (isActive !== undefined) query.active = isActive === "true";

  try {
    const cities = await masteredCity.find(query).sort({ cityName: 1 });
    res.status(200).json(cities);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ message: "Error fetching cities" });
  }
});

module.exports = router;