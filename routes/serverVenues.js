const express = require("express");
const router = express.Router();
const Venue = require("../models/venues");
const masteredCity = require("../models/masteredCities");
const rateLimiter = require("../middleware/rateLimiter");
const mongoose = require("mongoose");

router.use(rateLimiter);

async function isDuplicateVenue(latitude, longitude, masteredCityId, excludeId = null) {
  const query = {
    masteredCityId: new mongoose.Types.ObjectId(masteredCityId), // Scoped to the same city
    geolocation: {
      $near: {
        $geometry: { type: "Point", coordinates: [longitude, latitude] },
        $maxDistance: 100, // 100 meters
      },
    },
  };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const duplicate = await Venue.findOne(query);
  return !!duplicate;
}

async function findNearestMasteredCity(latitude, longitude) {
  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [longitude, latitude] },
        distanceField: "dist",
        spherical: true,
        query: { isActive: true }, // Updated to match the isActive field
      },
    },
    {
      $lookup: {
        from: "calculateddivisions",
        localField: "masteredDivisionId",
        foreignField: "_id",
        as: "division",
      },
    },
    { $unwind: { path: "$division", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "calculatedregions",
        localField: "division.masteredRegionId",
        foreignField: "_id",
        as: "region",
      },
    },
    { $unwind: { path: "$region", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "calculatedcountries",
        localField: "region.masteredCountryId",
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
    { $limit: 1 }, // $limit moved here as per MongoDB 4.2+ requirements
  ];

  const result = await masteredCity.aggregate(pipeline);
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

router.get("/", async (req, res) => {
  const { cityId, isActive } = req.query;
  const query = {};
  if (cityId) query.masteredCityId = new mongoose.Types.ObjectId(cityId);
  if (isActive !== undefined) query.isActive = isActive === "true";

  console.log("Fetching venues with query:", query);

  try {
    const venues = await Venue.find(query)
      .populate("masteredCityId", "cityName")
      .sort({ name: 1 });
    res.status(200).json(venues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({ message: "Error fetching venues" });
  }
});
router.post("/", async (req, res) => {
  const {
    name,
    shortName,
    address1,
    address2,
    address3,
    city,
    state,
    zip,
    phone,
    comments,
    latitude,
    longitude,
  } = req.body;

  if (!latitude || !longitude) {
    console.error("Missing latitude or longitude for venue.");
    return res.status(400).json({ message: "Latitude and longitude are required" });
  }

  try {
    const geoPoint = { type: "Point", coordinates: [longitude, latitude] };
    const cityInfo = await findNearestMasteredCity(latitude, longitude);

    if (!cityInfo) {
      console.log("Failed to find a nearest calculated city.");
      return res.status(404).json({ message: "No calculated city found nearby." });
    }

    const isDuplicate = await isDuplicateVenue(latitude, longitude, cityInfo.cityId);
    if (isDuplicate) {
      console.log("Duplicate venue detected.");
      return res.status(409).json({ message: "Duplicate venue within 100 meters." });
    }

    const newVenue = new Venue({
      name: name || "",
      shortName: shortName || "",
      address1: address1 || "",
      address2: address2 || "",
      address3: address3 || "",
      city: city || "",
      state: state || "",
      zip: zip || "",
      phone: phone || "",
      comments: comments || "",
      latitude,
      longitude,
      geolocation: geoPoint,
      masteredCityId: cityInfo.cityId,
      masteredDivisionId: cityInfo.divisionId,
      masteredRegionId: cityInfo.regionId,
      masteredCountryId: cityInfo.countryId,
      isActive: true, // Activate only if all required fields exist
    });

    await newVenue.save();
    console.log("New venue added:", newVenue);
    res.status(201).json(newVenue);
  } catch (error) {
    console.error("Error adding venue:", error);
    res.status(500).json({ message: "Error adding venue" });
  }
});

module.exports = router;