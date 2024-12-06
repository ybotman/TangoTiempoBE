// routes/serverVenues.js

const express = require("express");
const router = express.Router();
const Venue = require("../models/venues");
const calculatedCity = require("../models/calculatedCities");
const mongoose = require("mongoose");
const rateLimiter = require("../middleware/rateLimiter");

// Apply rate limiter
router.use(rateLimiter);

// Utility function to check for duplicates within 100 meters (~0.1 km)
async function isDuplicateVenue(latitude, longitude, excludeId = null) {
  const maxDistance = 100 / 6371008.8; // 100m in radians (approx)
  const query = {
    geolocation: {
      $near: {
        $geometry: { type: "Point", coordinates: [longitude, latitude] },
        $maxDistance: 100,
      },
    },
  };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const duplicate = await Venue.findOne(query);
  return !!duplicate;
}

// Utility to find nearest calculatedCity (and possibly division/region/country)
async function findNearestCalculatedCity(latitude, longitude) {
  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [longitude, latitude] },
        distanceField: "dist",
        spherical: true,
        query: { active: true },
        limit: 1,
      },
    },
    {
      $lookup: {
        from: "calculateddivisions",
        localField: "calculatedDivisionId",
        foreignField: "_id",
        as: "division",
      },
    },
    { $unwind: { path: "$division", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "calculatedregions",
        localField: "division.calculatedRegionId",
        foreignField: "_id",
        as: "region",
      },
    },
    { $unwind: { path: "$region", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "calculatedcountries",
        localField: "region.calculatedCountryId",
        foreignField: "_id",
        as: "country",
      },
    },
    { $unwind: { path: "$country", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        cityName: 1,
        divisionId: "$division._id",
        regionId: "$region._id",
        countryId: "$country._id",
      },
    },
  ];

  const result = await calculatedCity.aggregate(pipeline);
  if (result.length > 0) {
    const c = result[0];
    return {
      cityId: c._id,
      cityName: c.cityName,
      divisionId: c.divisionId,
      regionId: c.regionId,
      countryId: c.countryId,
    };
  } else {
    return null;
  }
}

// GET /venues?cityId=&active= (optional filters)
router.get("/", async (req, res) => {
  const { cityId, active } = req.query;
  const query = {};
  if (cityId) query.cityId = new mongoose.Types.ObjectId(cityId);
  if (active !== undefined) query.active = active === "true";

  try {
    const venues = await Venue.find(query).sort({ name: 1 });
    res.status(200).json(venues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({ message: "Error fetching venues" });
  }
});

// POST /venues - Add a new venue
// Expect: {name, shortName, address, cityName, ... optional cityId or we find nearest city}
router.post("/", async (req, res) => {
  const { name, shortName, address, latitude, longitude, cityName } = req.body;
  if (!name || !shortName || !address || !cityName) {
    return res
      .status(400)
      .json({
        message: "Missing required fields: name, shortName, address, cityName",
      });
  }

  // Ensure we have coordinates
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return res
      .status(400)
      .json({ message: "latitude and longitude must be numbers" });
  }

  try {
    // Check duplicates within 100m
    const isDup = await isDuplicateVenue(latitude, longitude);
    if (isDup) {
      return res
        .status(409)
        .json({ message: "A venue already exists within 100 meters." });
    }

    const cityInfo = await findNearestCalculatedCity(latitude, longitude);

    const newVenue = new Venue({
      name,
      shortName,
      address1,
      address2,
      address3,
      zip,
      phone,
      comments,
      city,
      state,
      calculatedCityId: cityInfo?.cityId || null,
      calculatedDivisionId: cityInfo?.divisionId || null,
      calculatedRegionId: cityInfo?.regionId || null,
      calculatedCountryId: cityInfo?.countryId || null,
      latitude,
      longitude,
      geolocation: { type: "Point", coordinates: [longitude, latitude] },
      active: true,
    });

    await newVenue.save();
    res.status(201).json(newVenue);
  } catch (error) {
    console.error("Error adding venue:", error);
    res.status(500).json({ message: "Error adding venue" });
  }
});

// PUT /venues/:id - Edit a venue
// Expect same fields as POST
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, shortName, address, cityName, latitude, longitude, active } =
    req.body;

  try {
    if (latitude && longitude) {
      const isDup = await isDuplicateVenue(latitude, longitude, id);
      if (isDup) {
        return res
          .status(409)
          .json({
            message: "Another venue is within 100 meters of these coordinates.",
          });
      }
    }

    let updateData = {};
    if (name !== undefined) updateData.name = name;
    if (shortName !== undefined) updateData.shortName = shortName;
    if (address1 !== undefined) updateData.address1 = address;
    if (address2 !== undefined) updateData.address2 = address;
    if (address3 !== undefined) updateData.address3 = address;
    if (city !== undefined) updateData.city = cityName;
    if (state !== undefined) updateData.state = cityName;
    if (phone !== undefined) updateData.phone = cityName;
    if (comments !== undefined) updateData.comments = cityName;

    if (typeof latitude === "number" && typeof longitude === "number") {
      const cityInfo = await findNearestCalculatedCity(latitude, longitude);
      updateData.latitude = latitude;
      updateData.longitude = longitude;
      updateData.geolocation = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
      updateData.calculatedCityId = cityInfo?.cityId || null;
      updateData.calculatedDivisionId = cityInfo?.divisionId || null;
      updateData.calculatedRegionId = cityInfo?.regionId || null;
      updateData.calculatedCountryId = cityInfo?.countryId || null;
    }
    if (active !== undefined) updateData.active = active;

    const updatedVenue = await Venue.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedVenue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    res.status(200).json(updatedVenue);
  } catch (error) {
    console.error("Error updating venue:", error);
    res.status(500).json({ message: "Error updating venue" });
  }
});

// DELETE /venues/:id - soft delete
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedVenue = await Venue.findByIdAndUpdate(
      id,
      { active: false },
      { new: true },
    );
    if (!updatedVenue) {
      return res.status(404).json({ message: "Venue not found" });
    }
    res.status(200).json({ message: "Venue deactivated", venue: updatedVenue });
  } catch (error) {
    console.error("Error deleting venue:", error);
    res.status(500).json({ message: "Error deleting venue" });
  }
});

module.exports = router;
