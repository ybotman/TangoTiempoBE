// routes/serverEvents.js
const express = require('express');
const router = express.Router();
const Events = require('../models/events');

// Get all events
router.get('/all', async (req, res) => {
    try {
        const events = await Events.find();
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Get events by calculated locations 
router.get('/byCalculatedLocations', async (req, res) => {
    try {
        const { calculatedRegionName, calculatedDivisionName, calculatedCityName, start, end, active } = req.query;

        if (!calculatedRegionName || !start || !end || active === undefined) {
            return res.status(400).json({ message: 'Region, start date, end date, and active status are required' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        const isActive = active === 'true';

        const query = {
            calculatedRegionName,
            startDate: { $gte: startDate, $lte: endDate },
            active: isActive,
        };

        if (calculatedDivisionName) {
            query.calculatedDivisionName = calculatedDivisionName;
        }

        if (calculatedCityName) {
            query.calculatedCityName = calculatedCityName;
        }

        const events = await Events.find(query).sort({ startDate: 1 });

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// Get event by ID
router.get('/id/:id', async (req, res) => {
    const eventId = req.params.id;

    try {
        const event = await Events.findById(eventId);
        if (event) {
            res.status(200).json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        console.error('Error fetching event by ID:', error);
        res.status(500).json({ message: 'Error fetching event by ID' });
    }
});

// Get events by owner
router.get('/owner/:ownerId', async (req, res) => {
    const ownerId = req.params.ownerId;

    try {
        const eventsByOwner = await Events.find({
            $or: [
                { ownerOrganizerID: ownerId },
                { grantedOrganizerID: ownerId },
                { alternateOrganizerID: ownerId }
            ]
        });

        res.status(200).json(eventsByOwner);
    } catch (error) {
        console.error('Error fetching events by ownerOrganizer:', error);
        res.status(500).json({ message: 'Error fetching events by organizer' });
    }
});

// Update an event
router.put('/:eventId', async (req, res) => {
    const eventId = req.params.eventId;
    const updatedEventData = req.body;

    try {
        const eventToUpdate = await Events.findById(eventId);
        if (!eventToUpdate) {
            res.status(404).json({ message: 'Event not found' });
            return;
        }

        Object.assign(eventToUpdate, updatedEventData);
        await eventToUpdate.save();
        res.status(200).json(eventToUpdate);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Error updating event' });
    }
});

// Create a new event with a CRUD endpoint
router.post('/post', async (req, res) => {
    const eventData = req.body;
    const userRole = req.user.role; // Assuming user role is passed in the request (from JWT or middleware)

    // Check if the user is an Active Regional Organizer
    if (userRole !== 'RegionalOrganizer' || !req.user.isActive) {
        return res.status(403).json({ message: 'Only Active Regional Organizers can add events' });
    }

    // Ensure required fields are provided
    if (!eventData.title || !eventData.startDate || !eventData.endDate || !eventData.ownerOrganizerID) {
        return res.status(400).json({ message: 'Title, Start Date, End Date, and Organizer ID are required' });
    }

    // Location validation and assignment (assuming location data is sent in eventData)
    if (!eventData.locationID) {
        return res.status(400).json({ message: 'Location is required' });
    }

    try {
        const newEvent = new Events(eventData);
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Error creating event' });
    }
});
module.exports = router;