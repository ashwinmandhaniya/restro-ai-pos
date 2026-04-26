const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: './backend/.env' });

async function fix() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/restro-billing';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    
    // Direct collection update to bypass schema strictness
    const result = await mongoose.connection.collection('restaurants').updateMany({}, {
      $set: {
        'multiOutlet.enabled': true,
        'multiOutlet.limit': 10
      }
    });
    
    console.log(`Successfully fixed ${result.modifiedCount} restaurants.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fix();
