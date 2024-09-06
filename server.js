// server.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

const cors = require('cors');

const allowedOrigins = [
    'http://localhost:3000', // Local development origin
    'https://wonderful-glacier-03516880f.5.azurestaticapps.net', // official test 
    'https://tangotiempo.com', // final production
    'https://www.tangotiempo.com', // final production
    'http://witty-bay-08177ec0f.5.azurestaticapps.net', // alternative production link
    'https://red-field-0006d060f.5.azurestaticapps.net', // integration
];

// REMOVE THIS
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else if (/^https:\/\/(wonderful-glacier-03516880f|witty-bay-08177ec0f|red-field-0006d060f)[a-z0-9\-\.]*\.5.azurestaticapps\.net/.test(origin)) {
            return callback(null, true);
        } else {
            const msg = 'The CORS policy for this site does not allow access from the specified origin.';
            return callback(new Error(msg), false);
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

// Middleware setup
app.use(bodyParser.json());
app.use(cors(corsOptions));

// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch((err) => console.log(`MongoDB connection error: ${err}`));

// Import routes
const eventRoutes = require('./routes/serverEvents');
const organizerRoutes = require('./routes/serverOrganizers');
const regionRoutes = require('./routes/serverRegions');
const categoryRoutes = require('./routes/serverCategories');
const locationRoutes = require('./routes/serverLocations');
const userLoginRoutes = require('./routes/serverUserLogins');
const firebaseRoutes = require('./routes/serverFirebase');
const roleRoutes = require('./routes/serverRoles');

// Use routes
app.use('/api/events', eventRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/userlogins', userLoginRoutes);
app.use('/api/firebase', firebaseRoutes);
app.use('/api/roles', roleRoutes);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});