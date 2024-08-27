// routes/serverUserLogin.js
const express = require('express');
const admin = require('firebase-admin');
//const serviceAccount = require('..///path-to-your-service-account-key.json'); // Make sure to provide the correct path
const router = express.Router();
const UserLogin = require('../models/userLogins');
const getFirebaseUserInfo = require('../utils/firebaseUserInfo');


router.post('/fetchAndStoreUser', async (req, res) => {
    const { firebaseUserId } = req.body;

    try {
        const userInfo = await getFirebaseUserInfo(firebaseUserId);

        const newUserLogin = new UserLogin({
            firebaseUserId: userInfo.uid,
            authType: userInfo.providerData[0].providerId,
            mfaEnabled: userInfo.multiFactor.enrolledFactors.length > 0,
            localUserInfo: {
                loginUserName: userInfo.displayName || userInfo.email.split('@')[0],
                firstName: userInfo.displayName?.split(' ')[0] || '',
                lastName: userInfo.displayName?.split(' ')[1] || '',
                icon: userInfo.photoURL || ''
            }
        });

        await newUserLogin.save();

        res.status(201).json(newUserLogin);
    } catch (error) {
        console.error('Error creating user login:', error);
        res.status(500).json({ message: 'Error creating user login' });
    }
});


module.exports = router;