import 'dotenv/config';
import connectDB from '../config/database.js';
import { User, Journey, Group } from '../models/index.js';

async function seedDatabase() {
  try {
    await connectDB();

    console.log('🌱 Starting database seed...');

    const users = await User.create([
      {
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
        bio: 'Adventure seeker'
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        password: 'password123',
        bio: 'Explorer'
      },
      {
        username: 'charlie',
        email: 'charlie@example.com',
        password: 'password123',
        bio: 'Nature lover'
      }
    ]);

    console.log('✅ Created sample users');

    const groups = await Group.create([
      {
        name: 'City Explorers',
        description: 'Discover hidden spots in the city',
        createdBy: users[0]._id,
        isPrivate: false
      }
    ]);

    console.log('✅ Created sample groups');

    const journeys = await Journey.create([
      {
        title: 'Find the Hidden Fountain',
        description: 'A beautiful fountain hidden in the old town',
        targetImage: '/images/fountain.jpg',
        targetLocation: {
          type: 'Point',
          coordinates: [-0.127758, 51.507351]
        },
        createdBy: users[0]._id,
        groupId: groups[0]._id,
        difficulty: 'easy',
        isPublic: true
      }
    ]);

    console.log('✅ Created sample journeys');
    console.log('🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();