const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rfid: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    sparse: true,  // This allows multiple null values
    unique: true   // Only enforces uniqueness on non-null values
  },
  vehicleNumber: {
    type: String,
    trim: true,
    sparse: true,  // This allows multiple null values
    unique: true   // Only enforces uniqueness on non-null values
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if user is admin
userSchema.methods.isAdminUser = function() {
  return this.isAdmin;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 