import React, { useState, useEffect } from 'react'
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api'

const containerStyle = {
    width: '100%',
    height: '100%',
};

const center = {
    lat: -3.745,
    lng: -38.523
};

const LiveTracking = () => {
    const [ currentPosition, setCurrentPosition ] = useState(center);

    useEffect(() => {
        const updatePosition = (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Position updated:', latitude, longitude);
            setCurrentPosition({
                lat: latitude,
                lng: longitude
            });
        };

        // Get initial position
        navigator.geolocation.getCurrentPosition(updatePosition);

        // Watch for position changes
        const watchId = navigator.geolocation.watchPosition(updatePosition);

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return (
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={currentPosition}
                zoom={15}
            >
                <Marker position={currentPosition} />
            </GoogleMap>
        </LoadScript>
    )
}

export default LiveTracking