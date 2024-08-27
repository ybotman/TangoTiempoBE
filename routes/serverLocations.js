const express = require('express');
const router = express.Router();
const Locations = require('../models/locations');

// GET all locations
router.get('/', async (req, res) => {
    try {
        const locations = await Locations.find();
        res.status(200).json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Error fetching locations' });
    }
});

// GET location by ID
router.get('/:id', async (req, res) => {
    const locationId = req.params.id;

    try {
        const location = await Locations.findById(locationId);
        if (location) {
            res.status(200).json(location);
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error) {
        console.error('Error fetching location by ID:', error);
        res.status(500).json({ message: 'Error fetching location by ID' });
    }
});

// GET location by name
router.get('/name/:name', async (req, res) => {
    const locationName = req.params.name;

    try {
        const location = await Locations.findOne({ name: locationName });
        if (location) {
            res.status(200).json(location);
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error) {
        console.error('Error fetching location by name:', error);
        res.status(500).json({ message: 'Error fetching location by name' });
    }
});

// GET locations by calculatedCity
router.get('/city/:calculatedCity', async (req, res) => {
    const calculatedCityId = req.params.calculatedCity;

    try {
        const locations = await Locations.find({ calculatedCity: calculatedCityId });
        res.status(200).json(locations);
    } catch (error) {
        console.error('Error fetching locations by calculatedCity:', error);
        res.status(500).json({ message: 'Error fetching locations by calculatedCity' });
    }
});

// POST a new location
router.post('/', async (req, res) => {
    const locationData = req.body;

    try {
        const newLocation = new Locations(locationData);
        await newLocation.save();
        res.status(201).json(newLocation);
    } catch (error) {
        console.error('Error creating location:', error);
        res.status(500).json({ message: 'Error creating location' });
    }
});

// PUT (update) a location by ID
router.put('/:id', async (req, res) => {
    const locationId = req.params.id;
    const updatedLocationData = req.body;

    try {
        const locationToUpdate = await Locations.findById(locationId);
        if (!locationToUpdate) {
            res.status(404).json({ message: 'Location not found' });
            return;
        }

        Object.assign(locationToUpdate, updatedLocationData);
        await locationToUpdate.save();
        res.status(200).json(locationToUpdate);
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: 'Error updating location' });
    }
});

module.exports = router;