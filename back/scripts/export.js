import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EJSON } from 'bson';
import connectDB from '../config/database.js';
import {
  User,
  Friends,
  Group,
  UserGroup,
  Journey,
  Step,
  UserJourney,
  Rating,
  Participation,
  Score
} from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportDatabase() {
  try {
    await connectDB();
    console.log('📦 Exporting database with proper ObjectIds...\n');

    const collections = {
      users: await User.find({}).lean(),
      friends: await Friends.find({}).lean(),
      groups: await Group.find({}).lean(),
      userGroups: await UserGroup.find({}).lean(),
      journeys: await Journey.find({}).lean(),
      steps: await Step.find({}).lean(),
      userJourneys: await UserJourney.find({}).lean(),
      ratings: await Rating.find({}).lean(),
      participations: await Participation.find({}).lean(),
      scores: await Score.find({}).lean()
    };

    // Create export directory
    const exportDir = path.join(__dirname, '../../db-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Export each collection to a separate JSON file using EJSON (Extended JSON)
    // This preserves ObjectId types for proper MongoDB Compass import
    for (const [name, data] of Object.entries(collections)) {
      const filePath = path.join(exportDir, `${name}.json`);
      // Use EJSON.stringify with relaxed mode for MongoDB Compass compatibility
      fs.writeFileSync(filePath, EJSON.stringify(data, null, 2, { relaxed: false }));
      console.log(`✅ Exported ${data.length} documents to ${name}.json`);
    }

    // Also create a combined export file
    const combinedPath = path.join(exportDir, 'all-collections.json');
    fs.writeFileSync(combinedPath, EJSON.stringify(collections, null, 2, { relaxed: false }));
    console.log(`\n📁 All data exported to: ${exportDir}`);
    console.log('ℹ️  Files use Extended JSON format - import via MongoDB Compass "Add Data > Import JSON"');

    process.exit(0);
  } catch (error) {
    console.error('❌ Export error:', error);
    process.exit(1);
  }
}

exportDatabase();
