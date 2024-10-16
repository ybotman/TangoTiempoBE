// routes/serverRegions.js
const express = require("express");
const router = express.Router();
const Regions = require("../models/regions");

// GET all regions
router.get("/", async (req, res) => {
  try {
    const regions = await Regions.find();
    res.status(200).json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    res.status(500).json({ message: "Error fetching regions" });
  }
});

// GET active regions
router.get("/activeRegions", async (req, res) => {
  try {
    const active = await Regions.find({ active: true });
    res.status(200).json(active);
  } catch (error) {
    console.error("Error fetching active regions:", error);
    res.status(500).json({ message: "Error fetching active regions" });
  }
});

// GET active divisions
router.get("/activeDivisions", async (req, res) => {
  try {
    const activeDivisions = await Regions.aggregate([
      { $unwind: "$divisions" },
      { $match: { "divisions.active": true } },
      {
        $project: {
          _id: 0,
          regionName: 1,
          regionCode: 1,
          divisionName: "$divisions.divisionName",
          states: "$divisions.states",
          majorCities: "$divisions.majorCities",
        },
      },
    ]);
    res.status(200).json(activeDivisions);
  } catch (error) {
    console.error("Error fetching active divisions:", error);
    res.status(500).json({ message: "Error fetching active divisions" });
  }
});

// GET active cities
router.get("/activeCities", async (req, res) => {
  try {
    const activeCities = await Regions.aggregate([
      { $unwind: "$divisions" },
      { $unwind: "$divisions.majorCities" },
      { $match: { "divisions.majorCities.active": true } },
      {
        $project: {
          _id: 0,
          regionName: 1,
          regionCode: 1,
          divisionName: "$divisions.divisionName",
          cityName: "$divisions.majorCities.cityName",
          latitude: "$divisions.majorCities.latitude",
          longitude: "$divisions.majorCities.longitude",
        },
      },
    ]);
    res.status(200).json(activeCities);
  } catch (error) {
    console.error("Error fetching active cities:", error);
    res.status(500).json({ message: "Error fetching active cities" });
  }
});

// PUT (update) active flag for a region
router.put("/region/:regionId/active", async (req, res) => {
  const { regionId } = req.params;
  const { active } = req.body;

  try {
    const region = await Regions.findById(regionId);
    if (!region) {
      return res.status(404).json({ message: "Region not found" });
    }

    // Update region active flag
    region.active = active;

    // If deactivating region, deactivate all divisions and cities within it
    if (!active) {
      region.divisions.forEach((division) => {
        division.active = false;
        division.majorCities.forEach((city) => (city.active = false));
      });
    }

    await region.save();
    res.status(200).json(region);
  } catch (error) {
    console.error("Error updating region active flag:", error);
    res.status(500).json({ message: "Error updating region active flag" });
  }
});

// PUT (update) active flag for a division within a specific region
router.put(
  "/region/:regionId/division/:divisionId/active",
  async (req, res) => {
    const { regionId, divisionId } = req.params;
    const { active } = req.body;

    try {
      const region = await Regions.findById(regionId);
      if (!region) {
        return res.status(404).json({ message: "Region not found" });
      }

      const division = region.divisions.id(divisionId);
      if (!division) {
        return res.status(404).json({ message: "Division not found" });
      }

      // Update division active flag
      division.active = active;

      // If activating division, ensure the region is also active
      if (active && !region.active) {
        region.active = true;
      }

      // If deactivating division, deactivate all cities within it
      if (!active) {
        division.majorCities.forEach((city) => (city.active = false));
      }

      await region.save();
      res.status(200).json(region);
    } catch (error) {
      console.error("Error updating division active flag:", error);
      res.status(500).json({ message: "Error updating division active flag" });
    }
  },
);

// PUT (update) active flag for a city within a specific division in a specific region
router.put(
  "/region/:regionId/division/:divisionId/city/:cityId/active",
  async (req, res) => {
    const { regionId, divisionId, cityId } = req.params;
    const { active } = req.body;

    try {
      const region = await Regions.findById(regionId);
      if (!region) {
        return res.status(404).json({ message: "Region not found" });
      }

      const division = region.divisions.id(divisionId);
      if (!division) {
        return res.status(404).json({ message: "Division not found" });
      }

      const city = division.majorCities.id(cityId);
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }

      // Update city active flag
      city.active = active;

      // If activating city, ensure the division and region are also active
      if (active) {
        if (!division.active) {
          division.active = true;
        }
        if (!region.active) {
          region.active = true;
        }
      }

      await region.save();
      res.status(200).json(region);
    } catch (error) {
      console.error("Error updating city active flag:", error);
      res.status(500).json({ message: "Error updating city active flag" });
    }
  },
);

module.exports = router;
