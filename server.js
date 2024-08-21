require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const Events = require('./models/events');
const Categories = require('./models/categories');
const Organizers = require('./models/organizers');
const Regions = require('./models/regions');
const Locations = require('./models/locations');

// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch((err) => console.log(`MongoDB connection error: ${err}`));

// Middleware for parsing JSON request bodies
app.use(bodyParser.json());
app.use(cors());


/*******************************


/************************************ EVENTS ******************************/

//Get Events All
app.get('/api/eventsAll', async (req, res) => {
    try {
        const { start, end, active } = req.query;

        // Validate that all required query parameters are provided
        if (!start || !end || active === undefined) {
            return res.status(400).json({ message: 'Start date, end date, and active status are required' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        const isActive = active === 'true';  // Convert string to boolean

        // Query for events based on start date, end date, and active status
        const events = await Events.find({
            startDate: { $gte: startDate, $lte: endDate },
            active: isActive
        });

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

// get events retire?
app.get('/api/events', async (req, res) => {
    try {
        const { calcuatedRegion, start, end, active } = req.query;

        if (!start || !end || active === undefined || !calcuatedRegion) {
            return res.status(400).json({ message: 'Region, start date, end date, and active status are required' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        const isActive = active === 'true';

        const events = await Events.find({
            calcuatedRegion,
            startDate: { $gte: startDate, $lte: endDate },
            active: isActive
        });

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

//get eventsRegion
app.get('/api/eventsRegion', async (req, res) => {
    try {
        const { calcuatedRegion, start, end, active } = req.query;

        if (!calcuatedRegion || !start || !end || active === undefined) {
            return res.status(400).json({ message: 'Region, start date, end date, and active status are required' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        const isActive = active === 'true';

        const query = {
            calcuatedRegion,
            startDate: { $gte: startDate, $lte: endDate },
            active: isActive
        };

        const events = await Events.find(query).sort({ startDate: 1 });

        res.status(200).json(events);
        console.log('app.get:api/eventsRegion, status(200)')
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

//get eventsCity
app.get('/api/eventsCity', async (req, res) => {
    try {
        const { calcuatedRegion, city, start, end, active, division } = req.query;

        if (!calcuatedRegion || !city || !start || !end || active === undefined) {
            return res.status(400).json({ message: 'Region, city, start date, end date, and active status are required' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        const isActive = active === 'true';

        const query = {
            calcuatedRegion,
            'majorCities.cityName': city,
            startDate: { $gte: startDate, $lte: endDate },
            active: isActive
        };

        if (division) {
            query.division = division;
        }

        const events = await Events.find(query);

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events by city:', error);
        res.status(500).json({ message: 'Error fetching events by city' });
    }
});

app.get('/api/eventsDivision', async (req, res) => {
    try {
        const { region, division, start, end, active } = req.query;

        // Validate that all required query parameters are provided
        if (!calcuatedRegion || !division || !start || !end || active === undefined) {
            return res.status(400).json({ message: 'Region, division, start date, end date, and active status are required' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        const isActive = active === 'true';

        // Query for events based on the region, division, date range, and active status
        const events = await Events.find({
            calcuatedRegion,
            division,
            startDate: { $gte: startDate, $lte: endDate },
            active: isActive
        });

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events by division:', error);
        res.status(500).json({ message: 'Error fetching events by division' });
    }
});

app.get('/api/events/:id', async (req, res) => {
    const eventId = req.params.id;

    try {
        const event = await Events.findById(eventId);
        if (event) {
            res.status(200).json(event);
            console.log('/api/events/:id, status(200)');
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        console.error('Error fetching event by ID:', error);
        res.status(500).json({ message: 'Error fetching event by ID' });
    }
});


//get events for owner (all granted)

app.get('/api/events/owner/:ownerId', async (req, res) => {
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
        console.log('/api/events/owner/:ownerId, status(200)');
    } catch (error) {
        console.error('Error fetching events by ownerOrganizer:', error);
        res.status(500).json({ message: 'Error fetching events by organizer' });
    }
});


app.put('/api/events/:eventId', async (req, res) => {
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


app.post('/api/createEvent', async (req, res) => {
    const eventData = req.body;
    console.log('app.post: /api/createEvent : Received data:', req.body);
    // Ensure required fields are provided
    if (!eventData.title || !eventData.startDate || !eventData.endDate || !eventData.ownerOrganizerID) {
        return res.status(400).json({ message: 'Title, Start Date, End Date, and Organizer ID are required' });
    }

    try {
        const newEvent = new Events(eventData);
        await newEvent.save();
        res.status(201).json(newEvent);
        console.log('POST /api/createEvent, status(200)');
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Error creating event' });
    }
});

/************************************ CATEGORIES ******************************/


//  GET CATEGORIES
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Categories.find();
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});


/************************************ REGIONS ******************************/

// GET REGIONS
app.get('/api/regions', async (req, res) => {
    try {
        const regions = await Regions.find();
        res.status(200).json(regions);
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).json({ message: 'Error fetching regions' });
    }
});

// GET Active Regions
app.get('/api/activeRegions', async (req, res) => {
    try {
        const activeRegions = await Regions.find({ active: true });
        res.status(200).json(activeRegions);
    } catch (error) {
        console.error('Error fetching active regions:', error);
        res.status(500).json({ message: 'Error fetching active regions' });
    }
});

// GET Active Divisions
app.get('/api/activeDivisions', async (req, res) => {
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

// GET Active Cities
app.get('/api/activeCities', async (req, res) => {
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

/************************************ LOCATIONS ******************************/

// GET /api/locations route to fetch all locations
app.get('/api/locations', async (req, res) => {
    try {
        const locations = await Locations.find();
        res.status(200).json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Error fetching locations' });
    }
});


// POST /api/locations route to create a new location
app.post('/api/locations', async (req, res) => {
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

app.put('/api/locations/:id', async (req, res) => {
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

/************************************ ORGANIZERS ******************************/
app.get('/api/organizers', async (req, res) => {
    try {
        const organizers = await Organizers.find();
        res.status(200).json(organizers);
    } catch (error) {
        console.error('Error fetching organizers:', error);
        res.status(500).json({ message: 'Error fetching organizers' });
    }
});

app.get('/api/organizers/:id', async (req, res) => {
    const organizerId = req.params.id;

    try {
        const organizer = await Organizers.findById(organizerId);
        if (organizer) {
            res.status(200).json(organizer);
        } else {
            res.status(404).json({ message: 'Organizer not found' });
        }
    } catch (error) {
        console.error('Error fetching organizer by ID:', error);
        res.status(500).json({ message: 'Error fetching organizer by ID' });
    }
});

app.get('/api/organizersActive', async (req, res) => {
    try {
        const activeOrganizers = await Organizers.find({ isActive: true });
        res.status(200).json(activeOrganizers);
    } catch (error) {
        console.error('Error fetching active organizers:', error);
        res.status(500).json({ message: 'Error fetching active organizers' });
    }
});
/*************************************************************************/


// GET /api/locations route to fetch all locations
app.get('/api/locations', async (req, res) => {
    try {
        const locations = await Locations.find();
        res.status(200).json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Error fetching locations' });
    }
});

// GET /api/locations/:id route to fetch a location by ID
app.get('/api/locations/:id', async (req, res) => {
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
/*************************************************************/


/***************************************  listen  **********************/
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});