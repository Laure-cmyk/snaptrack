import 'dotenv/config';
import mongoose from 'mongoose';

async function cleanDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/snaptrack';
    await mongoose.connect(mongoURI);

    console.log('🧹 Cleaning database...');

    // Drop all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`   Dropped collection: ${collection.name}`);
    }

    console.log('✅ Database cleaned successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
