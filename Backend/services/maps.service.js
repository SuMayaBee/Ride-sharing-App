const axios = require('axios');
const captainModel = require('../models/captain.model');

module.exports.getAddressCoordinate = async (address) => {
    const apiKey = process.env.GOOGLE_MAPS_API;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            const location = response.data.results[ 0 ].geometry.location;
            return {
                ltd: location.lat,
                lng: location.lng
            };
        } else {
            throw new Error('Unable to fetch coordinates');
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        console.log('Google Maps API Response:', response.data);
        
        if (response.data.status === 'OK') {
            if (response.data.rows[ 0 ].elements[ 0 ].status === 'ZERO_RESULTS') {
                throw new Error('No routes found');
            }

            return response.data.rows[ 0 ].elements[ 0 ];
        } else {
            console.error('Google Maps API Error Status:', response.data.status);
            console.error('Google Maps API Error Message:', response.data.error_message);
            throw new Error(`Google Maps API Error: ${response.data.status} - ${response.data.error_message || 'Unable to fetch distance and time'}`);
        }

    } catch (err) {
        console.error('Maps Service Error:', err.message);
        if (err.response) {
            console.error('API Response:', err.response.data);
        }
        throw err;
    }
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            return response.data.predictions.map(prediction => prediction.description).filter(value => value);
        } else {
            throw new Error('Unable to fetch suggestions');
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
    console.log('=== DISTANCE CALCULATION DEBUG ===');
    console.log('Search center coordinates:', { ltd, lng });
    console.log('Search radius (km):', radius);

    // Get ALL captains from database
    const allCaptains = await captainModel.find({});
    console.log('Total captains in database:', allCaptains.length);
    
    // Filter captains by distance using manual calculation
    const captainsInRadius = [];
    
    for (const captain of allCaptains) {
        if (captain.location && captain.location.ltd && captain.location.lng) {
            const distance = calculateDistance(
                ltd, lng, 
                captain.location.ltd, captain.location.lng
            );
            
            console.log(`Captain ${captain._id}:`);
            console.log(`  Location: { ltd: ${captain.location.ltd}, lng: ${captain.location.lng} }`);
            console.log(`  Distance from pickup: ${distance.toFixed(2)} km`);
            console.log(`  Within ${radius}km radius: ${distance <= radius ? 'YES' : 'NO'}`);
            console.log(`  Socket ID: ${captain.socketId}`);
            
            if (distance <= radius) {
                captainsInRadius.push(captain);
            }
        } else {
            console.log(`Captain ${captain._id}: No location data`);
        }
    }
    
    console.log(`=== RESULT: ${captainsInRadius.length} captains found within ${radius}km ===`);
    
    return captainsInRadius;
}