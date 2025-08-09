const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blackListTokenModel = require('../models/blackListToken.model');
const captainModel = require('../models/captain.model');


module.exports.authUser = async (req, res, next) => {
    console.log('=== AUTH MIDDLEWARE CALLED ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Headers:', req.headers.authorization);
    console.log('Cookies:', req.cookies);
    
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];
    console.log('Extracted token:', token ? 'Token found' : 'No token');

    if (!token) {
        console.log('No token provided - returning 401');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const isBlacklisted = await blackListTokenModel.findOne({ token: token });

    if (isBlacklisted) {
        console.log('Token is blacklisted');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        
        const user = await userModel.findById(decoded._id);
        console.log('Found user:', user ? 'User found' : 'User not found');

        if (!user) {
            console.log('User not found in database');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;
        return next();

    } catch (err) {
        console.log('Auth error:', err.message);
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports.authCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];


    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const isBlacklisted = await blackListTokenModel.findOne({ token: token });



    if (isBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const captain = await captainModel.findById(decoded._id)
        req.captain = captain;

        return next()
    } catch (err) {
        console.log(err);

        res.status(401).json({ message: 'Unauthorized' });
    }
}