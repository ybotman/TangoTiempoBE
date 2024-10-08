const express = require('express');
const router = express.Router();
const Locations = require('../models/locations');
const opencage = require('opencage-api-client');
const Regions = require('../models/regions'); // Adjust path as needed

// Utility function to geocode an address
async function geocodeAddress(address) {
    try {
        const response = await opencage.geocode({ q: address, key: process.env.OPENCAGE_API_KEY });
        if (response && response.results.length > 0) {
            const { lat, lng } = response.results[0].geometry;
            const formattedAddress = response.results[0].formatted; // Get the cleaned address
            return { latitude: lat, longitude: lng, formattedAddress };
        } else {
            throw new Error('No results found for the given address');
        }
    } catch (error) {
        console.error('Error geocoding address:', error);
        throw error;
    }
}

// Utility function to find the closest city, division, and region
async function findClosestCalculatedFields(lat, lng) {
    try {
        const regions = await Regions.find();

        let closestCity = null;
        let closestDivision = null;
        let closestRegion = null;
        let smallestDistance = Infinity;

        regions.forEach(region => {
            region.divisions.forEach(division => {
                division.majorCities.forEach(city => {
                    const distance = Math.sqrt(
                        Math.pow(city.latitude - lat, 2) + Math.pow(city.longitude - lng, 2)
                    );
                    if (distance < smallestDistance) {
                        smallestDistance = distance;
                        closestCity = city;
                        closestDivision = division;
                        closestRegion = region;
                    }
                });
            });
        });

        return {
            calculatedCity: closestCity._id,
            calculatedDivision: closestDivision._id,
            calculatedRegion: closestRegion._id
        };
    } catch (error) {
        console.error('Error finding closest calculated fields:', error);
        throw error;
    }
}

/* ******************* */

router.get('/', async (req, res) => {
    const { region, division, city } = req.query; // Extract region, division, city from query parameters

    try {
        let query = { activeFlag: true }; // Base query for active locations

        // If a region is provided, filter by calculatedRegion
        if (region) query.calculatedRegion = region;

        // If a division is provided, filter by calculatedDivision
        if (division) query.calculatedDivision = division;

        // If a city is provided, filter by calculatedCity
        if (city) query.calculatedCity = city;

        const locations = await Locations.find(query);
        res.status(200).json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Error fetching locations' });
    }
});


// GET /locations/active - Fetch all active locations
router.get('/active', async (req, res) => {
    console.warn('testing only do not use');
    try {
        const activeLocations = await Locations.find({ activeFlag: true });
        res.status(200).json(activeLocations);
    } catch (error) {
        console.error('Error fetching active locations:', error);
        res.status(500).json({ message: 'Error fetching active locations' });
    }
});


// GET /locations/all - Fetch all locations
router.get('/all', async (req, res) => {
        console.warn('testing only do not use');
    try {
        const allLocations = await Locations.find();
        res.status(200).json(allLocations);
    } catch (error) {
        console.error('Error fetching all locations:', error);
        res.status(500).json({ message: 'Error fetching all locations' });
    }
});

// GET /locations/:id - Fetch a location by its ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const location = await Locations.findById(id);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.status(200).json(location);
    } catch (error) {
        console.error('Error fetching location by ID:', error);
        res.status(500).json({ message: 'Error fetching location by ID' });
    }
});

// PUT /locations/:id - Update a location by its ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const updatedLocation = await Locations.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedLocation) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.status(200).json(updatedLocation);
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: 'Error updating location' });
    }
});


// POST route to create a new location with geocoding and calculated fields
router.post('/', async (req, res) => {
    const { address_1, address_2, city, state, zip } = req.body;

    try {
        const fullAddress = `${address_1}, ${address_2 || ''}, ${city}, ${state}, ${zip}`;

        // Geocode the address to get latitude, longitude, and the cleaned address
        const { latitude, longitude, formattedAddress } = await geocodeAddress(fullAddress);

        // Find the closest calculated city, division, and region
        const { calculatedCity, calculatedDivision, calculatedRegion } = await findClosestCalculatedFields(latitude, longitude);

        // Create the new location object with the cleaned address
        const newLocation = new Locations({
            name: req.body.name,
            address_1: formattedAddress, // Save the cleaned address
            address_2: req.body.address_2,
            city,
            state,
            zip,
            latitude,
            longitude,
            geolocation: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            calculatedCity,
            calculatedDivision,
            calculatedRegion,
            lastUsed: new Date() // Set the last used date to now
        });

        // Save the new location
        await newLocation.save();
        res.status(201).json(newLocation);
    } catch (error) {
        console.error('Error creating location:', error);
        res.status(500).json({ message: 'Error creating location' });
    }
});


module.exports = router;