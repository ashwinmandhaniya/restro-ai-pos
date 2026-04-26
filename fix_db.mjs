import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, './backend/.env') });

async function fix() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27014/restro-billing';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    
    // Enable multi-outlet for all restaurants in the collection
    const result = await mongoose.connection.collection('restaurants').updateMany({}, {
      $set: {
        'multiOutlet.enabled': true,
        'multiOutlet.limit': 10
      }
    });
    
    console.log(`Successfully enabled Multi-Outlet for ${result.modifiedCount} restaurants.`);
    process.exit(0);
  } catch (err) {
    console.error('Error enabling multi-outlet:', err);
    process.exit(1);
  }
}

fix();
