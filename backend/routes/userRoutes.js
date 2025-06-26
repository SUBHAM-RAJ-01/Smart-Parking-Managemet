const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mqtt = require('mqtt');

// MQTT client
const mqttClient = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com');
const PAYMENT_STATUS_TOPIC = 'parking/payment/status';

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, rfid, email, vehicleNumber } = req.body;
    
    if (!name || !rfid) {
      return res.status(400).json({ success: false, message: 'Name and RFID are required' });
    }
    
    // Check if RFID already exists
    const existingUser = await User.findOne({ rfid });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'RFID already registered' });
    }
    
    // Create user object with only defined fields
    const userData = {
      name,
      rfid,
      walletBalance: 0
    };
    
    // Only add email if it's provided
    if (email && email.trim() !== '') {
      userData.email = email;
    }
    
    // Only add vehicleNumber if it's provided
    if (vehicleNumber && vehicleNumber.trim() !== '') {
      userData.vehicleNumber = vehicleNumber;
    }
    
    const newUser = new User(userData);
    
    await newUser.save();
    
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { rfid } = req.body;
    
    if (!rfid) {
      return res.status(400).json({ success: false, message: 'RFID is required' });
    }
    
    const user = await User.findOne({ rfid });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user by RFID
router.get('/rfid/:rfid', async (req, res) => {
  try {
    const user = await User.findOne({ rfid: req.params.rfid });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user by RFID:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add funds to wallet
router.post('/:id/wallet/add', async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const userId = req.params.id;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Add funds to wallet
    user.walletBalance += amount;
    await user.save();
    
    // Generate a unique transaction ID
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const transactionId = `TXN-${timestamp}-${randomStr}`;
    
    // Add transaction
    const transaction = new Transaction({
      userId: user._id,
      transactionId,
      type: 'WALLET_TOPUP',
      amount,
      description: `Wallet top-up of ₹${amount}`,
      paymentMethod: paymentMethod || 'CARD'
    });
    
    await transaction.save();
    
    // Send payment status via MQTT
    mqttClient.publish(PAYMENT_STATUS_TOPIC, JSON.stringify({
      rfid: user.rfid,
      paid: true,
      walletBalance: user.walletBalance
    }));
    
    res.json({
      success: true,
      user,
      transaction
    });
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user transactions
router.get('/:id/transactions', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 });
    
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 