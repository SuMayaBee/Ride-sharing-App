const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');


module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, pickup, destination, vehicleType } = req.body;

    try {
        console.log('req.user in createRide:', req.user);
        console.log('req.user._id:', req.user ? req.user._id : 'req.user is null');
        
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User not authenticated properly' });
        }
        
        console.log('=== CREATING RIDE ===');
        console.log('Ride data:', { user: req.user._id, pickup, destination, vehicleType });
        
        const ride = await rideService.createRide({ user: req.user._id, pickup, destination, vehicleType });
        
        console.log('=== RIDE CREATED SUCCESSFULLY ===');
        console.log('Ride:', ride);
        
        // Send response first
        res.status(201).json(ride);

        console.log('=== ABOUT TO START BACKGROUND OPERATION ===');
        console.log('Ride created:', ride._id);

        // Then handle background operations (don't await these after response is sent)
        setImmediate(async () => {
            try {
                console.log('=== BACKGROUND OPERATION STARTED ===');
                console.log('Getting pickup coordinates for:', pickup);
                
                const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
                console.log('Pickup coordinates:', pickupCoordinates);
                
                console.log('Finding captains in radius...');
                const captainsInRadius = await mapService.getCaptainsInTheRadius(pickupCoordinates.ltd, pickupCoordinates.lng, 10);
                console.log('Captains found:', captainsInRadius.length);
                console.log('Captain details:', captainsInRadius.map(c => ({ id: c._id, socketId: c.socketId })));

                ride.otp = ""
                const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');
                console.log('Ride with user populated:', rideWithUser ? 'Success' : 'Failed');

                captainsInRadius.map(captain => {
                    console.log(`Sending notification to captain ${captain._id} with socket ${captain.socketId}`);
                    sendMessageToSocketId(captain.socketId, {
                        event: 'new-ride',
                        data: rideWithUser
                    })
                })
                
                console.log('=== BACKGROUND OPERATION COMPLETED ===');
            } catch (backgroundErr) {
                console.error('Background operation error:', backgroundErr);
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;

    try {
        const fare = await rideService.getFare(pickup, destination);
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {

        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        console.log(ride);

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride
        })



        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}