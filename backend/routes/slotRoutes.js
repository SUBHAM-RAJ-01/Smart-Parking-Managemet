const express = require('express');
const router = express.Router();
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');

// Get all parking slots
router.get('/', async (req, res) => {
  try {
    const slots = await ParkingSlot.find().sort({ slotNumber: 1 });
    res.json({ success: true, slots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get parking slot by number
router.get('/:slotNumber', async (req, res) => {
  try {
    const slot = await ParkingSlot.findOne({ slotNumber: req.params.slotNumber });
    
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    
    res.json({ success: true, slot });
  } catch (error) {
    console.error('Error fetching slot:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get slot with user details
router.get('/:slotNumber/details', async (req, res) => {
  try {
    const slot = await ParkingSlot.findOne({ slotNumber: req.params.slotNumber });
    
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    
    if (!slot.occupied || !slot.userId) {
      return res.json({ 
        success: true, 
        slot,
        user: null 
      });
    }
    
    const user = await User.findById(slot.userId);
    
    res.json({ 
      success: true, 
      slot,
      user: user ? {
        id: user._id,
        name: user.name,
        rfid: user.rfid,
        walletBalance: user.walletBalance
      } : null
    });
  } catch (error) {
    console.error('Error fetching slot details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get available slots count
router.get('/status/available', async (req, res) => {
  try {
    const totalSlots = await ParkingSlot.countDocuments();
    const occupiedSlots = await ParkingSlot.countDocuments({ occupied: true });
    const availableSlots = totalSlots - occupiedSlots;
    
    res.json({ 
      success: true, 
      totalSlots,
      availableSlots,
      occupiedSlots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 