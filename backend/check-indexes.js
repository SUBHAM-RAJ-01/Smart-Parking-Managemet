require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    
    // Get all indexes on User collection
    const indexes = await User.collection.indexes();
    console.log('User collection indexes:');
    console.log(JSON.stringify(indexes, null, 2));
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkIndexes(); 