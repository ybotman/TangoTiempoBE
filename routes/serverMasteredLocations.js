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


// GET /api/masteredLocations/nearestCity?latitude=&longitude=&maxDistance=&isActive=
router.get("/nearestCity", async (req, res) => {
  const { latitude, longitude, maxDistance, isActive } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: "latitude and longitude are required" });
  }

  try {
    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          ...(maxDistance && { $maxDistance: parseFloat(maxDistance) }),
        },
      },
    };

    if (isActive !== undefined) {
      query.active = isActive === "true";
    }

    const nearestCity = await masteredCity.findOne(query).populate({
      path: "masteredDivisionId",
      populate: {
        path: "masteredRegionId",
        populate: {
          path: "masteredCountryId",
        },
      },
    });

    if (!nearestCity) {
      return res.status(404).json({ message: "No nearby city found" });
    }

    const response = {
      cityID: nearestCity._id,
      cityName: nearestCity.cityName,
      distance: nearestCity.distance || null, // Include distance if needed
      regionID: nearestCity.masteredDivisionId.masteredRegionId._id,
      regionName: nearestCity.masteredDivisionId.masteredRegionId.regionName,
      divisionID: nearestCity.masteredDivisionId._id,
      divisionName: nearestCity.masteredDivisionId.divisionName,
      countryID: nearestCity.masteredDivisionId.masteredRegionId.masteredCountryId._id,
      countryName: nearestCity.masteredDivisionId.masteredRegionId.masteredCountryId.countryName,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching nearest city:", error);
    res.status(500).json({ message: "Error fetching nearest city" });
  }
});

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