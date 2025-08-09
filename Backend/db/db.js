const mongoose = require('mongoose');


function connectToDb() {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', process.env.DB_CONNECT ? 'Found' : 'Missing');
    
    mongoose.connect(process.env.DB_CONNECT, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    }).then(() => {
        console.log('✅ Connected to MongoDB successfully');
    }).catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('Full error:', err);
    });

    // Handle connection events
    mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected from MongoDB');
    });
}


module.exports = connectToDb;