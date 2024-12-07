// routes/serverVenues.js
const express = require("express");
const router = express.Router();
const Venue = require("../models/venues");
const calculatedCity = require("../models/calculatedCities");
const rateLimiter = require("../middleware/rateLimiter");
const mongoose = require("mongoose");

router.use(rateLimiter);

async function isDuplicateVenue(latitude, longitude, excludeId = null) {
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

async function findNearestCalculatedCity(latitude, longitude) {
  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [longitude, latitude] },
        distanceField: "dist",
        spherical: true,
        query: { active: true }, // If you have changed to isActive in calculatedCities, adjust similarly
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

// GET /venues?cityId=&isActive=
router.get("/", async (req, res) => {
  const { cityId, isActive } = req.query;
  const query = {};
  if (cityId) query.calculatedCityId = new mongoose.Types.ObjectId(cityId);
  if (isActive !== undefined) query.isActive = isActive === "true";

  try {
    const venues = await Venue.find(query)
      .populate("calculatedCityId", "cityName")
      .sort({ name: 1 });
    res.status(200).json(venues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({ message: "Error fetching venues" });
  }
});

// POST /venues
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

  // Name and shortName are no longer required (default: ""), so no error if missing
  // If you want them optional, remove the validation. If you still want them required, keep this check:
  // if (!name || !shortName) {
  //   return res.status(400).json({
  //     message: "Missing required fields: name, shortName",
  //   });
  // }

  let geoPoint = null;
  let cityInfo = null;
  let isActive = false; // default isActive = false

  if (typeof latitude === "number" && typeof longitude === "number") {
    const isDup = await isDuplicateVenue(latitude, longitude);
    if (isDup) {
      return res
        .status(409)
        .json({ message: "A venue already exists within 100 meters." });
    }

    cityInfo = await findNearestCalculatedCity(latitude, longitude);
    geoPoint = { type: "Point", coordinates: [longitude, latitude] };
  }

  if (geoPoint && cityInfo && name && shortName) {
    isActive = true;
  } else {
    // If missing lat/long or city hierarchy or name/shortName,
    // remains isActive = false
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
    latitude: typeof latitude === "number" ? latitude : undefined,
    longitude: typeof longitude === "number" ? longitude : undefined,
    geolocation: geoPoint,
    calculatedCityId: cityInfo?.cityId || null,
    calculatedDivisionId: cityInfo?.divisionId || null,
    calculatedRegionId: cityInfo?.regionId || null,
    calculatedCountryId: cityInfo?.countryId || null,
    isActive: isActive,
  });

  try {
    await newVenue.save();
    res.status(201).json(newVenue);
  } catch (error) {
    console.error("Error adding venue:", error);
    res.status(500).json({ message: "Error adding venue" });
  }
});

// PUT /venues/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
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
    isActive,
  } = req.body;

  let updateData = {};

  if (name !== undefined) updateData.name = name;
  if (shortName !== undefined) updateData.shortName = shortName;
  if (address1 !== undefined) updateData.address1 = address1;
  if (address2 !== undefined) updateData.address2 = address2;
  if (address3 !== undefined) updateData.address3 = address3;
  if (city !== undefined) updateData.city = city;
  if (state !== undefined) updateData.state = state;
  if (zip !== undefined) updateData.zip = zip;
  if (phone !== undefined) updateData.phone = phone;
  if (comments !== undefined) updateData.comments = comments;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (typeof latitude === "number" && typeof longitude === "number") {
    const isDup = await isDuplicateVenue(latitude, longitude, id);
    if (isDup) {
      return res
        .status(409)
        .json({
          message: "Another venue is within 100 meters of these coordinates.",
        });
    }
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

    if (cityInfo && name && shortName) {
      if (isActive === undefined) updateData.isActive = true;
    } else {
      if (!cityInfo || !name || !shortName) {
        updateData.isActive = false;
      }
    }
  }

  try {
    const updatedVenue = await Venue.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("calculatedCityId", "cityName");
    if (!updatedVenue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    res.status(200).json(updatedVenue);
  } catch (error) {
    console.error("Error updating venue:", error);
    res.status(500).json({ message: "Error updating venue" });
  }
});

// DELETE /venues/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Soft delete sets isActive = false
    const updatedVenue = await Venue.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
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