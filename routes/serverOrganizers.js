const express = require('express');
const router = express.Router();
const Organizers = require('../models/organizers');

// POST: Create a new organizer
router.post('/', async (req, res) => {
    try {
        const organizer = new Organizers(req.body);
        const savedOrganizer = await organizer.save();
        res.status(201).json(savedOrganizer);
    } catch (error) {
        console.error('Error creating organizer:', error);
        res.status(500).json({ message: 'Error creating organizer' });
    }
});


// GET all organizers (no filters)
router.get('/all', async (req, res) => {
    try {
        console.warn('Fetching all organizers -- do not use this');
        const organizers = await Organizers.find({});
        res.status(200).json(organizers);
    } catch (error) {
        console.error('Error fetching all organizers:', error);
        res.status(500).json({ message: 'Error fetching all organizers' });
    }
});


// GET: Retrieve organizers filtered by region, division, and city
router.get('/', async (req, res) => {
    const { region, division, city } = req.query; // Extract region, division, city from query parameters

    try {
        let query = { activeFlag: true }; // Base query for active organizers

        // If a region is provided, filter by organizerRegion
        if (region) query.organizerRegion = region;

        // If a division is provided, filter by organizerDivision
        if (division) query.organizerDivision = division;

        // If a city is provided, filter by organizerCity
        if (city) query.organizerCity = city;

        const organizers = await Organizers.find(query); // Fetch organizers matching the query
        res.status(200).json(organizers); // Return the filtered organizers
    } catch (error) {
        console.error('Error fetching organizers:', error);
        res.status(500).json({ message: 'Error fetching organizers' });
    }
});


// PUT: Update an existing organizer by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedOrganizer = await Organizers.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedOrganizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }
        res.status(200).json(updatedOrganizer);
    } catch (error) {
        console.error('Error updating organizer:', error);
        res.status(500).json({ message: 'Error updating organizer' });
    }
});

// DELETE: Delete an organizer by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedOrganizer = await Organizers.findByIdAndDelete(req.params.id);
        if (!deletedOrganizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }
        res.status(200).json({ message: 'Organizer deleted' });
    } catch (error) {
        console.error('Error deleting organizer:', error);
        res.status(500).json({ message: 'Error deleting organizer' });
    }
});

module.exports = router;
