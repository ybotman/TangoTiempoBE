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

app.get('/api/eventsAll', async (req, res) => {
    try {

        // Find events based on the region
        const events = await Events.find()

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

/* will be retured */
app.get('/api/events', async (req, res) => {
    try {
        // Get the region from the request query, default to "UNK"
        const region = req.query.region || 'UNK';

        // Find events based on the region
        const events = await Events.find({ region });

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

app.get('/api/eventsRegion', async (req, res) => {
    try {
        const { region, start, end } = req.query;

        if (!region) {
            return res.status(400).json({ message: 'Region is required' });
        }

        if (!start || !end) {
            return res.status(400).json({ message: 'Start and end dates are required' });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        const query = {
            startDate: { $gte: startDate, $lte: endDate },
            region: region,
        };

        const events = await Events.find(query)
            .sort({ startDate: 1 }) // Sort by start date in ascending order
            .exec(); // Execute the query

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});

app.get('/api/events/:id', async (req, res) => {
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

app.get('/api/events/owner/:ownerId', async (req, res) => {
    const ownerId = req.params.ownerId;

    try {
        const eventsByOwner = await Events.find({ ownerOrganizer: ownerId });
        res.status(200).json(eventsByOwner);
    } catch (error) {
        console.error('Error fetching events by ownerOrganizer:', error);
        res.status(500).json({ message: 'Error fetching events by ownerOrganizer' });
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

    // Ensure required fields are provided
    if (!eventData.title || !eventData.startDate || !eventData.endDate || !eventData.ownerOrganizerID) {
        return res.status(400).json({ message: 'Title, Start Date, End Date, and Organizer ID are required' });
    }

    // Additional validation can be added here as needed

    try {
        const newEvent = new Events(eventData);
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Error creating event' });
    }
});

/************************************ CATEGORIES ******************************/

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

app.get('/api/regions', async (req, res) => {
    try {
        const regions = await Regions.find();
        res.status(200).json(regions);
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).json({ message: 'Error fetching regions' });
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