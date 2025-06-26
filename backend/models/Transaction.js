const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transactionId: {
    type: String,
    sparse: true,   // Allow multiple null values
    unique: true    // Only enforce uniqueness on non-null values
  },
  type: {
    type: String,
    enum: ['WALLET_TOPUP', 'PARKING_FEE'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['CARD', 'UPI', 'NETBANKING', 'WALLET'],
    default: 'WALLET'
  }
});

// Generate a unique transaction ID before saving if not provided
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    // Generate a transaction ID based on timestamp and random string
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.transactionId = `TXN-${timestamp}-${randomStr}`;
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 