# 🚗 Campus Ride

A Real-Time Campus Mobility and Ride Management Platform designed to streamline transportation and ride-sharing services for campus communities.

---

## 📋 Project Overview

**Campus Ride** is a modern, full-stack web application that enables students and campus users to efficiently manage and coordinate rides within and around campus. The platform provides real-time ride tracking, request management, and seamless communication between riders and drivers, creating a sustainable and convenient transportation solution for the campus community.

### Key Objectives:
- Enable easy ride requests and ride sharing
- Provide real-time ride tracking and updates
- Foster a community-driven transportation network
- Improve campus mobility and reduce congestion
- Create a user-friendly interface for all stakeholders

---

## 💻 Technology Stack

### Frontend
- **React** (v18.2.0) - UI library for building interactive components
- **Vite** (v5.1.5) - Next-generation frontend build tool for fast development and optimized production builds
- **React Router DOM** (v6.22.3) - Client-side routing and navigation
- **Tailwind CSS** (v3.4.1) - Utility-first CSS framework for styling
- **Socket.io Client** (v4.7.4) - Real-time bidirectional communication
- **Axios** (v1.6.7) - HTTP client for API requests
- **Recharts** (v2.12.2) - Data visualization library
- **React Hot Toast** (v2.4.1) - Toast notifications
- **Lucide React** (v0.363.0) - Modern icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.io** - Real-time communication library
- **MongoDB** - NoSQL database (via Docker Compose)

### DevOps & Tools
- **Docker & Docker Compose** - Containerization and multi-container orchestration
- **npm** - Package manager
- **Concurrently** - Run multiple npm scripts simultaneously

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **Docker** and **Docker Compose** (for database services)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/pH-1491/campusRide.git
   cd campusRide
   ```

2. **Install Root Dependencies**
   ```bash
   npm install
   ```

3. **Install All Dependencies (Root, Client, and Server)**
   ```bash
   npm run install:all
   ```
   
   This command will install dependencies for the root project, server, and client directories.

4. **Set Up Environment Variables**
   
   Create `.env` files in both the `server` and `client` directories:

   **server/.env**
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/campusRide
   NODE_ENV=development
   ```

   **client/.env**
   ```env
   VITE_API_URL=http://localhost:5001
   ```

5. **Start Database Services (Optional - with Docker)**
   ```bash
   docker-compose up -d
   ```
   
   This starts the MongoDB database and any other services defined in `docker-compose.yml`.

---

## ▶️ Running the Application

### Development Mode

Run both the server and client simultaneously:
```bash
npm run dev
```

This command uses **concurrently** to start:
- **Backend Server**: `npm run dev:server` (runs from `server` directory)
- **Frontend Client**: `npm run dev:client` (runs from `client` directory)

The application will be accessible at:
- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend API**: `http://localhost:5000` (Express server)

### Development - Individual Services

**Start only the backend server:**
```bash
npm run dev:server
```

**Start only the frontend client:**
```bash
npm run dev:client
```

### Production Build

Build the frontend for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

---

## ✨ Feature List

### Core Features

#### 🚗 Ride Management
- **Create Ride Requests**: Users can easily post ride requests with pickup/dropoff locations and time
- **Browse Available Rides**: Browse and filter available rides in real-time
- **Ride Matching**: Intelligent matching between riders and drivers
- **Request Acceptance**: Drivers can accept or decline ride requests

#### 📍 Real-Time Tracking
- **Live Location Updates**: Real-time tracking of ride locations using Socket.io
- **Route Visualization**: Visual representation of the ride route
- **Driver Location Sharing**: Drivers can share their location with riders

#### 💬 Communication
- **In-App Messaging**: Direct messaging between riders and drivers
- **Notifications**: Real-time push notifications for ride updates
- **Toast Alerts**: Instant feedback on user actions

#### 👤 User Management
- **User Registration & Authentication**: Secure user signup and login
- **User Profiles**: Manage user information and preferences
- **Rating & Reviews**: Rate and review rides and users
- **User History**: View past rides and transactions

#### 📊 Dashboard & Analytics
- **Ride Statistics**: View statistics about rides, ratings, and activity
- **User Metrics**: Track personal ride history and analytics
- **Data Visualization**: Charts and graphs using Recharts

#### 💾 Data Persistence
- **MongoDB Database**: Persistent storage for users, rides, and transactions
- **Reliable Backend**: Express.js API for secure data handling
- **API Integration**: RESTful APIs for all frontend-backend communication

---

## 📁 Project Structure

```
campusRide/
├── client/                 # React frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── server/                 # Express backend application
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── package.json
├── docker-compose.yml      # Docker services configuration
├── package.json            # Root package.json with scripts
└── README.md              # This file
```

---

## 🔧 Troubleshooting

### Port Already in Use
If port 5000 or 5173 is already in use, you can change them:
- **Backend**: Update `PORT` in `server/.env`
- **Frontend**: Update Vite config in `client/vite.config.js`

### Database Connection Issues
- Ensure MongoDB is running via Docker: `docker-compose up -d`
- Check MongoDB URI in `server/.env`
- Verify network connectivity between services

### Module Not Found Errors
Run `npm run install:all` to ensure all dependencies are installed in all directories.

---

## 📝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---



## 📧 Support & Contact

For questions, issues, or suggestions, please open an issue on the [GitHub repository](https://github.com/pH-1491/campusRide/issues).

---

**Happy Riding! 🎉**
