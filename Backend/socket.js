const socketIo = require('socket.io');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: [ 'GET', 'POST' ]
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Debug: Log all events received by this socket
        socket.onAny((eventName, ...args) => {
            console.log(`=== SOCKET EVENT RECEIVED ===`);
            console.log(`Event: ${eventName}`);
            console.log(`From Socket: ${socket.id}`);
            console.log(`Data:`, args);
        });

        socket.on('join', async (data) => {
            console.log(`=== SOCKET JOIN ===`);
            console.log(`Socket ID: ${socket.id}`);
            console.log(`User Data:`, data);
            
            const { userId, userType } = data;

            if (userType === 'user') {
                await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
                console.log(`User ${userId} joined with socket ${socket.id}`);
            } else if (userType === 'captain') {
                await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
                console.log(`Captain ${userId} joined with socket ${socket.id}`);
            }
        });


        socket.on('update-location-captain', async (data) => {
            console.log('=== CAPTAIN LOCATION UPDATE ===');
            console.log('Data received:', data);
            
            const { userId, location } = data;

            if (!location || !location.ltd || !location.lng) {
                console.log('Invalid location data:', location);
                return socket.emit('error', { message: 'Invalid location data' });
            }

            console.log(`Updating captain ${userId} location to:`, location);
            console.log('Update query:', {
                location: {
                    ltd: location.ltd,
                    lng: location.lng
                }
            });
            
            try {
                // First, let's check if the captain exists
                const existingCaptain = await captainModel.findById(userId);
                console.log('Captain exists in database:', existingCaptain ? 'YES' : 'NO');
                if (existingCaptain) {
                    console.log('Existing captain data:', {
                        id: existingCaptain._id,
                        email: existingCaptain.email,
                        currentLocation: existingCaptain.location
                    });
                }

                const updatedCaptain = await captainModel.findByIdAndUpdate(
                    userId, 
                    {
                        location: {
                            ltd: location.ltd,
                            lng: location.lng
                        }
                    }, 
                    { new: true }
                );
                
                console.log('Captain location updated:', updatedCaptain ? 'Success' : 'Failed');
                if (updatedCaptain) {
                    console.log('Updated captain document:', {
                        id: updatedCaptain._id,
                        email: updatedCaptain.email,
                        location: updatedCaptain.location,
                        socketId: updatedCaptain.socketId
                    });
                    console.log('New location in database:', updatedCaptain.location);
                } else {
                    console.log('No captain found with ID:', userId);
                    
                    // Let's see what captains actually exist
                    const allCaptains = await captainModel.find({});
                    console.log('All captains in database:', allCaptains.map(c => ({
                        id: c._id.toString(),
                        email: c.email
                    })));
                }
            } catch (error) {
                console.error('Database update error:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {
    console.log(`=== SENDING MESSAGE TO SOCKET ===`);
    console.log(`Target Socket ID: ${socketId}`);
    console.log(`Message:`, messageObject);

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
        console.log(`Message sent successfully to ${socketId}`);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = { initializeSocket, sendMessageToSocketId };