require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-parking');
    console.log('MongoDB connected');
    
    const db = mongoose.connection;
    
    try {
      // Drop the problematic index if it exists
      console.log('Dropping vehicleNumber index...');
      await db.collection('users').dropIndex('vehicleNumber_1');
      console.log('Index dropped successfully');
    } catch (err) {
      console.log('Index may not exist or already dropped:', err.message);
    }
    
    // Create a new index with sparse option
    console.log('Creating new sparse index for vehicleNumber...');
    await db.collection('users').createIndex(
      { vehicleNumber: 1 }, 
      { 
        unique: true, 
        sparse: true, 
        background: true,
        name: 'vehicleNumber_1_sparse'  // Give it a specific name
      }
    );
    console.log('New index created successfully');
    
    // Get all indexes to verify
    const indexes = await db.collection('users').indexes();
    console.log('Current indexes:');
    console.log(JSON.stringify(indexes, null, 2));
    
    mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

fixIndexes(); 