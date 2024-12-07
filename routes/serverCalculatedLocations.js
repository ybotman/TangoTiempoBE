// routes/serverCalculatedLocations.js
const express = require("express");
const router = express.Router();
const calculatedCity = require("../models/calculatedCities");
const mongoose = require("mongoose");
const rateLimiter = require("../middleware/rateLimiter");

router.use(rateLimiter);

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
    const maxDistanceMeters = 482803; // ~300 miles

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
          // Return IDs and names so frontend can store references
          cityId: "$_id",
          cityName: 1,
          cityCode: 1,
          divisionId: "$division._id",
          divisionName: "$division.divisionName",
          divisionCode: "$division.divisionCode",
          regionId: "$region._id",
          regionName: "$region.regionName",
          regionCode: "$region.regionCode",
          countryId: "$country._id",
          countryName: "$country.countryName",
          countryCode: "$country.countryCode",
          distance: 1,
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

    const distanceInMiles = nearest[0].distance / 1609.34;
    if (distanceInMiles > 300) {
      return res
        .status(404)
        .json({ message: "No nearby city found within 300 miles" });
    }

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