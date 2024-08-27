// util/firebaseUserInfo.js
const admin = require('firebase-admin');

async function getFirebaseUserInfo(firebaseUserId) {
    try {
        const userRecord = await admin.auth().getUser(firebaseUserId);
        return userRecord;
    } catch (error) {
        console.error('Error fetching Firebase user data:', error);
        throw new Error('Unable to fetch user data from Firebase');
    }
}

module.exports = getFirebaseUserInfo;