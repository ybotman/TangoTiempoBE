// routes/serverCalculatedLocations.js
const express = require("express");
const router = express.Router();
const calculatedCity = require("../models/calculatedCites");
const mongoose = require("mongoose");
const rateLimiter = require("../middleware/rateLimiter");

// Apply rate limiter to all routes in this router
router.use(rateLimiter);

// GET nearest city from calculatedCity collection
// This endpoint returns the closest city within 300 miles (approx 482803 meters).
// If not found or beyond 300 miles, it returns a "No nearby city found within 300 miles" message.
router.get("/nearestCity", async (req, res) => {
  const { longitude, latitude } = req.query;

  if (!longitude || !latitude) {
    return res
      .status(400)
      .json({ message: "Longitude and latitude are required" });
  }

  const longitudeNum = parseFloat(longitude);
  const latitudeNum = parseFloat(latitude);

  if (isNaN(longitudeNum) || isNaN(latitudeNum)) {
    return res
      .status(400)
      .json({ message: "Longitude and latitude must be valid numbers" });
  }

  try {
    // 300 miles in meters (~482803 m)
    const maxDistanceMeters = 482803;

    // Use $geoNear to find the closest active city within 300 miles
    // We also join division, region, country data via $lookup
    const pipeline = [
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitudeNum, latitudeNum],
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: maxDistanceMeters,
          query: { active: true },
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
      { $unwind: "$division" },
      {
        $lookup: {
          from: "calculatedregions",
          localField: "division.calculatedRegionId",
          foreignField: "_id",
          as: "region",
        },
      },
      { $unwind: "$region" },
      {
        $lookup: {
          from: "calculatedcountries",
          localField: "region.calculatedCountryId",
          foreignField: "_id",
          as: "country",
        },
      },
      { $unwind: "$country" },
      {
        $project: {
          _id: 0,
          cityName: 1,
          cityCode: 1,
          divisionName: "$division.divisionName",
          divisionCode: "$division.divisionCode",
          regionName: "$region.regionName",
          regionCode: "$region.regionCode",
          countryName: "$country.countryName",
          countryCode: "$country.countryCode",
          distance: 1, // distance in meters
        },
      },
      { $sort: { distance: 1 } },
      { $limit: 1 },
    ];

    const nearest = await calculatedCity.aggregate(pipeline);

    if (!nearest.length) {
      return res
        .status(404)
        .json({ message: "No nearby city found within 300 miles" });
    }

    // Optional: Convert distance to miles
    const distanceInMiles = nearest[0].distance / 1609.34;
    // Check if distance > 300 miles (just in case)
    if (distanceInMiles > 300) {
      return res
        .status(404)
        .json({ message: "No nearby city found within 300 miles" });
    }

    // Include distance in miles for clarity
    const result = {
      ...nearest[0],
      distanceMiles: parseFloat(distanceInMiles.toFixed(2)),
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching nearest city:", error);
    return res.status(500).json({ message: "Error fetching nearest city" });
  }
});

module.exports = router;
