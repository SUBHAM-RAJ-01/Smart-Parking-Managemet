const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 8
  },
  occupied: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rfid: {
    type: String,
    default: null
  },
  entryTime: {
    type: Date,
    default: null
  }
});

const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);

module.exports = ParkingSlot; 