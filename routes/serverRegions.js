// routes/serverRegions.js
const express = require('express');
const router = express.Router();
const Regions = require('../models/regions');

// GET all regions
router.get('/', async (req, res) => {
    try {
        const regions = await Regions.find();
        res.status(200).json(regions);
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).json({ message: 'Error fetching regions' });
    }
});

// GET active regions
router.get('/activeRegions', async (req, res) => {
    try {
        const activeRegions = await Regions.find({ active: true });
        res.status(200).json(activeRegions);
    } catch (error) {
        console.error('Error fetching active regions:', error);
        res.status(500).json({ message: 'Error fetching active regions' });
    }
});

// GET active divisions
router.get('/activeDivisions', async (req, res) => {
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
                    majorCities: "$divisions.majorCities"
                }
            }
        ]);
        res.status(200).json(activeDivisions);
    } catch (error) {
        console.error('Error fetching active divisions:', error);
        res.status(500).json({ message: 'Error fetching active divisions' });
    }
});

// GET active cities
router.get('/activeCities', async (req, res) => {
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
                    longitude: "$divisions.majorCities.longitude"
                }
            }
        ]);
        res.status(200).json(activeCities);
    } catch (error) {
        console.error('Error fetching active cities:', error);
        res.status(500).json({ message: 'Error fetching active cities' });
    }
});


// PUT (update) region's active flag by region _id
router.put('/:id/active', async (req, res) => {
    const regionId = req.params.id;
    const { active } = req.body;

    try {
        const region = await Regions.findByIdAndUpdate(
            regionId,
            { active },
            { new: true }
        );
        if (region) {
            res.status(200).json(region);
        } else {
            res.status(404).json({ message: 'Region not found' });
        }
    } catch (error) {
        console.error('Error updating region active flag:', error);
        res.status(500).json({ message: 'Error updating region active flag' });
    }
});

// PUT (update) division's active flag by division _id within a specific region
router.put('/:regionId/division/:divisionId/active', async (req, res) => {
    const { regionId, divisionId } = req.params;
    const { active } = req.body;

    try {
        const region = await Regions.findById(regionId);
        if (!region) {
            return res.status(404).json({ message: 'Region not found' });
        }

        const division = region.divisions.id(divisionId);
        if (!division) {
            return res.status(404).json({ message: 'Division not found' });
        }

        division.active = active;
        await region.save();

        res.status(200).json(division);
    } catch (error) {
        console.error('Error updating division active flag:', error);
        res.status(500).json({ message: 'Error updating division active flag' });
    }
});

// PUT (update) city's active flag by city _id within a specific division in a specific region
router.put('/:regionId/division/:divisionId/city/:cityId/active', async (req, res) => {
    const { regionId, divisionId, cityId } = req.params;
    const { active } = req.body;

    try {
        const region = await Regions.findById(regionId);
        if (!region) {
            return res.status(404).json({ message: 'Region not found' });
        }

        const division = region.divisions.id(divisionId);
        if (!division) {
            return res.status(404).json({ message: 'Division not found' });
        }

        const city = division.majorCities.id(cityId);
        if (!city) {
            return res.status(404).json({ message: 'City not found' });
        }

        city.active = active;
        await region.save();

        res.status(200).json(city);
    } catch (error) {
        console.error('Error updating city active flag:', error);
        res.status(500).json({ message: 'Error updating city active flag' });
    }
});


module.exports = router;