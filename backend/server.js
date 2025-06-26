require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const mqtt = require('mqtt');
const moment = require('moment');

// Import models
const User = require('./models/User');
const ParkingSlot = require('./models/ParkingSlot');
const Transaction = require('./models/Transaction');

// Import routes
const userRoutes = require('./routes/userRoutes');
const slotRoutes = require('./routes/slotRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-parking')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize parking slots if they don't exist
const initializeParkingSlots = async () => {
  try {
    const count = await ParkingSlot.countDocuments();
    if (count === 0) {
      const slots = [];
      for (let i = 1; i <= 8; i++) {
        slots.push({ slotNumber: i });
      }
      await ParkingSlot.insertMany(slots);
      console.log('Parking slots initialized');
    }
  } catch (error) {
    console.error('Error initializing parking slots:', error);
  }
};

initializeParkingSlots();

// MQTT Setup
const mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com');
const ENTRY_TOPIC = 'parking/entry';
const ENTRY_RESPONSE_TOPIC = 'parking/entry/response';
const EXIT_TOPIC = 'parking/exit';
const EXIT_RESPONSE_TOPIC = 'parking/exit/response';
const PAYMENT_STATUS_TOPIC = 'parking/payment/status';

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe(ENTRY_TOPIC);
  mqttClient.subscribe(EXIT_TOPIC);
});

// Handle MQTT messages
mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log(`Received message on ${topic}:`, data);

    if (topic === ENTRY_TOPIC) {
      await handleEntryRequest(data);
    } else if (topic === EXIT_TOPIC) {
      await handleExitRequest(data);
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});

// Handle entry request
async function handleEntryRequest(data) {
  const { rfid, deviceId } = data;
  
  try {
    // Find user by RFID
    const user = await User.findOne({ rfid });
    
    if (!user) {
      // User not found
      mqttClient.publish(ENTRY_RESPONSE_TOPIC, JSON.stringify({
        success: false,
        message: 'User not registered'
      }));
      return;
    }
    
    // Check if there are available slots
    const availableSlot = await ParkingSlot.findOne({ occupied: false });
    
    if (!availableSlot) {
      // No slots available
      mqttClient.publish(ENTRY_RESPONSE_TOPIC, JSON.stringify({
        success: false,
        message: 'No parking slots available'
      }));
      return;
    }
    
    // Assign slot to user
    availableSlot.occupied = true;
    availableSlot.rfid = rfid;
    availableSlot.userId = user._id;
    availableSlot.entryTime = new Date();
    await availableSlot.save();
    
    // Send response
    mqttClient.publish(ENTRY_RESPONSE_TOPIC, JSON.stringify({
      success: true,
      userName: user.name,
      slotNumber: availableSlot.slotNumber
    }));
  } catch (error) {
    console.error('Error handling entry request:', error);
    mqttClient.publish(ENTRY_RESPONSE_TOPIC, JSON.stringify({
      success: false,
      message: 'Server error'
    }));
  }
}

// Handle exit request
async function handleExitRequest(data) {
  const { rfid, deviceId } = data;
  
  try {
    // Find user by RFID
    const user = await User.findOne({ rfid });
    
    if (!user) {
      // User not found
      mqttClient.publish(EXIT_RESPONSE_TOPIC, JSON.stringify({
        success: false,
        message: 'User not registered'
      }));
      return;
    }
    
    // Find the slot occupied by this user
    const occupiedSlot = await ParkingSlot.findOne({ rfid, occupied: true });
    
    if (!occupiedSlot) {
      // No slot found for this user
      mqttClient.publish(EXIT_RESPONSE_TOPIC, JSON.stringify({
        success: false,
        message: 'No active parking found'
      }));
      return;
    }
    
    // Calculate parking duration and fee
    const entryTime = moment(occupiedSlot.entryTime);
    const exitTime = moment();
    const durationMinutes = exitTime.diff(entryTime, 'minutes');
    
    // Calculate fee: ₹5 per 15 minutes + base charge of ₹10
    const baseCharge = 10;
    const timeBlocks = Math.ceil(durationMinutes / 15);
    const parkingFee = baseCharge + (timeBlocks * 5);
    
    // Format duration for display
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const formattedDuration = `${hours}h ${minutes}m`;
    
    // Check if user has enough balance
    if (user.walletBalance >= parkingFee) {
      // Deduct fee from wallet
      user.walletBalance -= parkingFee;
      await user.save();
      
      // Generate a unique transaction ID
      const timestamp = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const transactionId = `TXN-${timestamp}-${randomStr}`;
      
      // Add transaction
      await Transaction.create({
        userId: user._id,
        transactionId,
        type: 'PARKING_FEE',
        amount: -parkingFee,
        description: `Parking fee for slot ${occupiedSlot.slotNumber} (${formattedDuration})`,
        paymentMethod: 'WALLET'
      });
      
      // Free up the slot
      occupiedSlot.occupied = false;
      occupiedSlot.rfid = null;
      occupiedSlot.userId = null;
      occupiedSlot.entryTime = null;
      await occupiedSlot.save();
      
      // Send success response
      mqttClient.publish(EXIT_RESPONSE_TOPIC, JSON.stringify({
        success: true,
        userName: user.name,
        parkingFee,
        parkingDuration: formattedDuration,
        paymentStatus: 'WALLET',
        walletBalance: user.walletBalance
      }));
    } else {
      // Insufficient balance
      mqttClient.publish(EXIT_RESPONSE_TOPIC, JSON.stringify({
        success: true,
        userName: user.name,
        parkingFee,
        parkingDuration: formattedDuration,
        paymentStatus: 'INSUFFICIENT_BALANCE',
        walletBalance: user.walletBalance
      }));
    }
  } catch (error) {
    console.error('Error handling exit request:', error);
    mqttClient.publish(EXIT_RESPONSE_TOPIC, JSON.stringify({
      success: false,
      message: 'Server error'
    }));
  }
}

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/admin', adminRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 