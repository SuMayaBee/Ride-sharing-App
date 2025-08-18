# 🚗 RideSphare - A Ride-Sharing Application

A full-stack ride-sharing platform built with Node.js, Express, React, and MongoDB. This application provides comprehensive ride booking services with real-time tracking, payment processing, and dual user interfaces for both passengers and drivers (captains).

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Backend Implementation](#-backend-implementation)
- [Frontend Implementation](#-frontend-implementation)
- [Setup Instructions](#-setup-instructions)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

## 🎯 Project Overview

This ride-sharing application is a comprehensive platform that connects passengers with drivers, similar to Uber or Lyft. The system handles user authentication, ride booking, real-time tracking, payment processing, and provides separate interfaces for both passengers and drivers.

### Key Capabilities:
- **Dual User System**: Separate authentication and interfaces for passengers and drivers (captains)
- **Real-time Communication**: WebSocket integration for live ride updates and tracking
- **Payment Processing**: Complete payment system with multiple payment methods
- **Geolocation Services**: Google Maps integration for location services and routing
- **Ride Management**: End-to-end ride lifecycle management
- **Security**: JWT-based authentication with token blacklisting

## 🏗️ Architecture

### Monolithic Architecture Overview

This application follows a **monolithic architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Frontend)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React     │  │  Socket.io  │  │   Payment UI        │  │
│  │   Router    │  │   Client    │  │   Components        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Server Layer (Backend)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Express.js │  │  Socket.io  │  │   Payment Gateway   │  │
│  │   Routes    │  │   Server    │  │   Service           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                              │                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │Controllers  │  │Middlewares  │  │      Services       │  │
│  │             │  │(Auth, CORS) │  │  (Maps, Rides)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Mongoose ODM
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   MongoDB   │  │Collections: │  │   Indexes &         │  │
│  │   Atlas     │  │Users,Rides, │  │   Relationships     │  │
│  │             │  │Payments,etc │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Benefits:
- **Simplicity**: Single deployable unit, easier to develop and test
- **Performance**: No network latency between components
- **Consistency**: ACID transactions across the entire application
- **Development Speed**: Faster initial development and debugging

## ✨ Features

### 👤 User Features
- **Authentication**: Secure registration and login
- **Profile Management**: Update personal information
- **Ride Booking**: Request rides with pickup and destination
- **Real-time Tracking**: Live location updates during rides
- **Payment Processing**: Multiple payment methods (Card, PayPal, Apple Pay, Google Pay)
- **Ride History**: View past trips and payments
- **Fare Estimation**: Get price estimates before booking
<img width="1915" height="994" alt="Screenshot from 2025-08-18 06-44-53" src="https://github.com/user-attachments/assets/f571972f-1da6-4a70-8e89-675e7c18001c" />

  
### 🚗 Captain (Driver) Features
- **Driver Registration**: Register with vehicle details
- **Ride Acceptance**: Accept or decline ride requests
- **Navigation**: Turn-by-turn directions to pickup and destination
- **Earnings Tracking**: View trip earnings and payment history
- **Vehicle Management**: Update vehicle information
- **Real-time Status**: Online/offline status management
<img width="1915" height="994" alt="Screenshot from 2025-08-18 06-45-14" src="https://github.com/user-attachments/assets/b6d87e44-8c49-42cc-97e6-da1768d3d9ad" />


### 🔧 System Features
- **Real-time Communication**: WebSocket-based live updates
- **Geolocation Services**: Google Maps integration
- **Payment Gateway**: Secure payment processing with fraud detection
- **Token Management**: JWT authentication with blacklist functionality
- **Rate Limiting**: API protection against abuse
- **Error Handling**: Comprehensive error management

## 🛠️ Backend Implementation

### Core Technologies
- **Runtime**: Node.js (JavaScript runtime)
- **Framework**: Express.js (Web application framework)
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.io for WebSocket communication
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator for input validation
- **Security**: bcrypt for password hashing, CORS for cross-origin requests

### Database Models

#### 1. User Model (`user.model.js`)
```javascript
{
  fullname: { firstname, lastname },
  email: String (unique, validated),
  password: String (hashed),
  socketId: String
}
```

#### 2. Captain Model (`captain.model.js`)
```javascript
{
  fullname: { firstname, lastname },
  email: String (unique),
  password: String (hashed),
  socketId: String,
  status: Enum['active', 'inactive'],
  vehicle: {
    color: String,
    plate: String,
    capacity: Number,
    vehicleType: Enum['car', 'motorcycle', 'auto']
  },
  location: {
    ltd: Number,
    lng: Number
  }
}
```

#### 3. Ride Model (`ride.model.js`)
```javascript
{
  user: ObjectId (ref: 'user'),
  captain: ObjectId (ref: 'captain'),
  pickup: String,
  destination: String,
  fare: Number,
  status: Enum['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
  duration: Number (seconds),
  distance: Number (meters),
  payment: ObjectId (ref: 'payment'),
  paymentStatus: Enum['pending', 'completed', 'failed', 'refunded'],
  otp: String (select: false)
}
```

#### 4. Payment Model (`payment.model.js`)
```javascript
{
  user: ObjectId (ref: 'user'),
  ride: ObjectId (ref: 'ride'),
  amount: Number,
  currency: String,
  paymentMethod: Enum['card', 'paypal', 'apple_pay', 'google_pay', 'wallet'],
  transactionId: String (unique),
  status: Enum['pending', 'processing', 'completed', 'failed', 'refunded'],
  gatewayResponse: {
    gatewayTransactionId: String,
    responseCode: String,
    responseMessage: String,
    processingFee: Number
  },
  cardDetails: {
    last4Digits: String,
    cardType: String,
    expiryMonth: Number,
    expiryYear: Number
  }
}
```

#### 5. BlackList Token Model (`blackListToken.model.js`)
```javascript
{
  token: String (unique),
  createdAt: Date (expires: 24h)
}
```

### Service Layer Architecture

#### 1. Payment Service (`payment.service.js`)
- **PaymentGatewayService**: Simulates realistic payment processing
  - 97% success rate with authentic failure scenarios
  - Processing delays (100-800ms) for realistic UX
  - Transaction ID generation and risk scoring
  - Support for multiple payment methods
  - Refund processing capabilities

#### 2. Maps Service (`maps.service.js`)
- **Google Maps Integration**: Geocoding and routing services
  - Address to coordinates conversion
  - Distance and duration calculations
  - Autocomplete suggestions for addresses
  - Route optimization

#### 3. Ride Service (`ride.service.js`)
- **Ride Management**: Complete ride lifecycle handling
  - Fare calculation based on distance and vehicle type
  - OTP generation for ride verification
  - Status management throughout the ride
  - Captain assignment algorithms

### Controller Layer

#### Authentication Controllers
- **User Controller**: Registration, login, profile, logout
- **Captain Controller**: Driver-specific authentication and management

#### Business Logic Controllers
- **Ride Controller**: Ride creation, management, and completion
- **Maps Controller**: Location and routing services
- **Payment Controller**: Payment processing and history

### Middleware Implementation

#### 1. Authentication Middleware (`auth.middleware.js`)
```javascript
// JWT token verification
// Token blacklist checking
// User/Captain role-based access control
```

#### 2. Security Middleware
- **CORS**: Cross-origin request handling
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Request data sanitization

### Real-time Features (Socket.io)

#### Socket Events:
- **join**: User/Captain connects to their room
- **update-location-captain**: Captain location updates
- **ride-started**: Ride initiation notifications
- **ride-ended**: Ride completion notifications

## 🎨 Frontend Implementation

### Technology Stack
- **Framework**: React 18 with Hooks
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for utility-first styling
- **Routing**: React Router DOM for navigation
- **Icons**: Remix Icons for consistent iconography
- **Maps**: Google Maps React integration
- **Animations**: GSAP for smooth animations

### Component Architecture

#### Context Providers
- **UserContext**: User state management
- **CaptainContext**: Driver state management
- **SocketContext**: Real-time communication state
- **PaymentContext**: Payment processing state

#### Page Components
- **Authentication Pages**: Login/Signup for users and captains
- **Home Pages**: Dashboard for users and captains
- **Riding Pages**: Active ride interfaces
- **Protected Routes**: Route guards for authenticated users

#### UI Components
- **PaymentModal**: Complete payment processing interface
- **PaymentHistory**: Transaction history with refund options
- **LocationSearchPanel**: Address autocomplete and selection
- **VehiclePanel**: Vehicle type selection
- **LiveTracking**: Real-time ride tracking

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (Local installation or MongoDB Atlas account)
- **Google Maps API Key**

### 1. Clone the Repository
```bash
git clone https://github.com/SuMayaBee/Ride-sharing-App.git
cd Ride-sharing-App
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd Backend
npm install
```

#### Environment Configuration
The `.env` file is already configured, but verify these variables:

```bash
# Database Configuration
DB_CONNECT=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Google Maps API
GOOGLE_MAPS_API=your-google-maps-api-key

# Server Port
PORT=3000
```

#### Start Backend Server
```bash
# Option 1: Direct node execution
node server.js

# Option 2: Using nodemon for development
npm install -g nodemon
nodemon server.js
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Environment Configuration
Verify the `.env` file in the frontend directory:

```bash
VITE_BASE_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

#### Start Frontend Development Server
```bash
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5173 (Vite default)
- **Backend API**: http://localhost:3000
- **Database**: MongoDB Atlas (cloud) or Local MongoDB

### 5. Testing the Application

#### User Flow:
1. Register as a user at `/signup`
2. Login at `/login`
3. Book a ride from the home page
4. Process payment using the payment modal
5. Track ride in real-time

#### Captain Flow:
1. Register as a captain at `/captain-signup`
2. Login at `/captain-login`
3. Go online and accept ride requests
4. Complete rides and track earnings

## 📚 API Documentation

### Authentication Endpoints
- `POST /users/register` - User registration
- `POST /users/login` - User login
- `GET /users/profile` - Get user profile
- `GET /users/logout` - User logout

### Captain Endpoints
- `POST /captains/register` - Captain registration
- `POST /captains/login` - Captain login
- `GET /captains/profile` - Get captain profile
- `GET /captains/logout` - Captain logout

### Ride Endpoints
- `POST /rides/create` - Create a new ride
- `GET /rides/get-fare` - Get fare estimate
- `POST /rides/confirm` - Confirm ride booking
- `POST /rides/start-ride` - Start ride (Captain)
- `POST /rides/end-ride` - End ride (Captain)

### Payment Endpoints
- `POST /payments/process` - Process payment
- `GET /payments/history` - Get payment history
- `POST /payments/:paymentId/refund` - Request refund
- `GET /payments/methods/saved` - Get saved payment methods

### Maps Endpoints
- `GET /maps/get-coordinates` - Get coordinates for address
- `GET /maps/get-distance-time` - Get distance and time between locations
- `GET /maps/get-suggestions` - Get address autocomplete suggestions

## 🔧 Environment Variables

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_CONNECT` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `GOOGLE_MAPS_API` | Google Maps API key | Yes |
| `PORT` | Server port (default: 3000) | No |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_BASE_URL` | Backend API URL | Yes |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key for frontend | Yes |

## 📁 Project Structure

```
uber-video/
├── Backend/
│   ├── controllers/           # Request handlers
│   │   ├── captain.controller.js
│   │   ├── map.controller.js
│   │   ├── payment.controller.js
│   │   ├── ride.controller.js
│   │   └── user.controller.js
│   ├── db/                   # Database configuration
│   │   └── db.js
│   ├── middlewares/          # Custom middleware
│   │   └── auth.middleware.js
│   ├── models/              # Database schemas
│   │   ├── blackListToken.model.js
│   │   ├── captain.model.js
│   │   ├── payment.model.js
│   │   ├── ride.model.js
│   │   └── user.model.js
│   ├── routes/              # API routes
│   │   ├── captain.routes.js
│   │   ├── maps.routes.js
│   │   ├── payment.routes.js
│   │   ├── ride.routes.js
│   │   └── user.routes.js
│   ├── services/            # Business logic
│   │   ├── captain.service.js
│   │   ├── maps.service.js
│   │   ├── payment.service.js
│   │   ├── ride.service.js
│   │   └── user.service.js
│   ├── .env                 # Environment variables
│   ├── app.js               # Express app configuration
│   ├── package.json         # Dependencies and scripts
│   ├── README.md            # Backend documentation
│   ├── server.js            # Server entry point
│   └── socket.js            # Socket.io configuration
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── assets/          # Images and icons
│   │   ├── components/      # Reusable UI components
│   │   │   ├── CaptainDetails.jsx
│   │   │   ├── ConfirmRide.jsx
│   │   │   ├── PaymentModal.jsx
│   │   │   ├── PaymentHistory.jsx
│   │   │   └── ...
│   │   ├── context/         # React context providers
│   │   │   ├── CaptainContext.jsx
│   │   │   ├── PaymentContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   └── UserContext.jsx
│   │   ├── pages/           # Page components
│   │   │   ├── CaptainHome.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── UserLogin.jsx
│   │   │   └── ...
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # App entry point
│   ├── .env                 # Frontend environment variables
│   ├── package.json         # Dependencies and scripts
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── vite.config.js       # Vite configuration
└── README.md                # This file
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Token Blacklisting**: Logout functionality with token invalidation
- **Input Validation**: Express-validator for request validation
- **CORS Protection**: Cross-origin request security
- **Environment Variables**: Sensitive data protection


