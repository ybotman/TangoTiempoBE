const connectDB = require('../db');
const Organizers = require('../models/organizers');



// Replace the example values with your own
const startOrgs = [
    {
        organizerName: 'Ultimate Tango',
        organizerShortName: 'UT',
        region: 'Boston',
        activeBool: true,
        paidBool: false,
    },
    {
        organizerName: 'Boston Tango Society',
        organizerShortName: 'BTS',
        region: 'Boston',
        activeBool: true,
        paidBool: false
    },

];


const seedOrganizersToDatabase = async () => {
    await connectDB();

    try {
        await Organizers.insertMany(startOrgs);
        console.log('Test startOrgs added successfully');
        process.exit();
    } catch (error) {
        console.error('Error adding test startOrgs:', error);
        process.exit(1);
    }
};

seedOrganizersToDatabase();

