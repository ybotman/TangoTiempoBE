const express = require("express");
const router = express.Router();
const calculatedCity = require("../models/calculatedCities");
const mongoose = require("mongoose");
const rateLimiter = require("../middleware/rateLimiter");

router.use(rateLimiter);

router.get("/nearestCity", async (req, res) => {
  const { longitude, latitude } = req.query;

  if (!longitude || !latitude) {
    console.error("Missing coordinates in request.");
    return res.status(400).json({ message: "Longitude and latitude are required" });
  }

  const longitudeNum = parseFloat(longitude);
  const latitudeNum = parseFloat(latitude);

  if (isNaN(longitudeNum) || isNaN(latitudeNum)) {
    console.error("Invalid coordinates provided.");
    return res.status(400).json({ message: "Longitude and latitude must be valid numbers" });
  }

  try {
    const maxDistanceMeters = 482803; // ~300 miles
    console.log(`Searching for nearest city with coordinates: (${latitude}, ${longitude})`);

    const pipeline = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitudeNum, latitudeNum] },
          distanceField: "distance",
          spherical: true,
          maxDistance: maxDistanceMeters,
          query: { isActive: true },
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
          cityId: "$_id",
          cityName: 1,
          divisionName: "$division.divisionName",
          regionName: "$region.regionName",
          countryName: "$country.countryName",
          distance: 1,
        },
      },
      { $sort: { distance: 1 } },
      { $limit: 1 },
    ];

    const nearest = await calculatedCity.aggregate(pipeline);

    if (!nearest.length) {
      console.log("No nearby city found within 300 miles.");
      return res.status(404).json({ message: "No nearby city found within 300 miles" });
    }

    const distanceInMiles = nearest[0].distance / 1609.34;
    console.log("Nearest city found:", nearest[0], `Distance: ${distanceInMiles.toFixed(2)} miles`);

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