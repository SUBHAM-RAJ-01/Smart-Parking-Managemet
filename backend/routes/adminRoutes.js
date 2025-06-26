const express = require('express');
const router = express.Router();
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Force exit a vehicle (admin function)
router.post('/slots/:slotNumber/force-exit', async (req, res) => {
  try {
    const slotNumber = parseInt(req.params.slotNumber);
    
    const slot = await ParkingSlot.findOne({ slotNumber });
    
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    
    if (!slot.occupied) {
      return res.status(400).json({ success: false, message: 'Slot is not occupied' });
    }
    
    // Free up the slot
    slot.occupied = false;
    slot.rfid = null;
    slot.userId = null;
    slot.entryTime = null;
    
    await slot.save();
    
    res.json({ success: true, message: 'Vehicle forcefully removed from slot', slot });
  } catch (error) {
    console.error('Error forcing exit:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(100); // Limit to last 100 transactions
    
    res.json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get dashboard summary
router.get('/dashboard/summary', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSlots = await ParkingSlot.countDocuments();
    const occupiedSlots = await ParkingSlot.countDocuments({ occupied: true });
    
    // Calculate total revenue
    const transactions = await Transaction.find({ type: 'PARKING_FEE' });
    const totalRevenue = transactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    
    // Calculate revenue for the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const dailyTransactions = await Transaction.find({
      type: 'PARKING_FEE',
      timestamp: { $gte: oneDayAgo }
    });
    
    const dailyRevenue = dailyTransactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.amount), 0
    );
    
    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json({
      success: true,
      totalUsers,
      totalSlots,
      occupiedSlots,
      availableSlots: totalSlots - occupiedSlots,
      totalRevenue,
      dailyRevenue,
      recentTransactions
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 