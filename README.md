# Smart Parking and Management System

A comprehensive RFID-based Smart Parking System with MQTT communication, wallet-based payments, and web interfaces for users and administrators.

## Project Structure

- **backend/** - Node.js backend with MongoDB, Express, and MQTT
- **client/** - React-based user interface for vehicle owners
- **admin/** - React-based admin dashboard for parking management
- **smart_parking_system.ino** - Arduino code for the hardware controller

## Features

- RFID-based vehicle authentication
- Automated entry/exit control with servo motors
- Real-time slot assignment and management
- Wallet-based payment system
- User dashboard with transaction history
- Admin panel for monitoring and management
- MQTT communication between hardware and server

## Setup Instructions

### Backend

1. Navigate to the backend directory and install dependencies:
   ```
   cd backend
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

### Client Interface

1. Navigate to the client directory and install dependencies:
   ```
   cd client
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

### Admin Interface

1. Navigate to the admin directory and install dependencies:
   ```
   cd admin
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

### Arduino Setup

1. Open the `smart_parking_system.ino` file in Arduino IDE
2. Install required libraries through the Library Manager
3. Update WiFi credentials and MQTT broker details
4. Upload the sketch to your Arduino Uno R4 WiFi

## Default Login Credentials

### Client
- Use your RFID number to login/register

### Admin
- Username: admin
- Password: admin123 