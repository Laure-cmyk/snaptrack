import 'dotenv/config';
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

async function seedDatabase() {
  try {
    await connectDB();

    console.log('🌱 Starting database seed...');

    // ============ USERS ============
    const users = await User.create([
      {
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
        profilePicture: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=alice',
        bio: 'Adventure seeker and photographer'
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        password: 'password123',
        profilePicture: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=bob.svg',
        bio: 'Passionate explorer from Geneva'
      },
      {
        username: 'charlie',
        email: 'charlie@example.com',
        password: 'password123',
        profilePicture: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=charlie.svg',
        bio: 'Nature lover and hiking enthusiast'
      },
      {
        username: 'diana',
        email: 'diana@example.com',
        password: 'password123',
        profilePicture: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=diana.svg',
        bio: 'Urban explorer'
      },
      {
        username: 'eve',
        email: 'eve@example.com',
        password: 'password123',
        profilePicture: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=eve.svg',
        bio: 'Travel and photo enthusiast'
      }
    ]);

    // ============ FRIENDS ============
    const friends = await Friends.create([
      {
        userId: users[0]._id,
        friendId: users[1]._id,
        status: 'accepted',
        requestedAt: new Date('2025-11-01'),
        acceptedAt: new Date('2025-11-02')
      },
      {
        userId: users[0]._id,
        friendId: users[2]._id,
        status: 'accepted',
        requestedAt: new Date('2025-10-15'),
        acceptedAt: new Date('2025-10-16')
      },
      {
        userId: users[1]._id,
        friendId: users[3]._id,
        status: 'pending'
      },
      {
        userId: users[3]._id,
        friendId: users[0]._id,
        status: 'accepted',
        requestedAt: new Date('2025-11-20'),
        acceptedAt: new Date('2025-11-21')
      },
      {
        userId: users[3]._id,
        friendId: users[4]._id,
        status: 'accepted',
        requestedAt: new Date('2025-11-10'),
        acceptedAt: new Date('2025-11-11')
      },
      {
        userId: users[4]._id,
        friendId: users[0]._id,
        status: 'blocked',
        requestedAt: new Date('2025-09-05'),
        acceptedAt: null
      }
    ]);

    // ============ GROUPS ============
    const groups = await Group.create([
      {
        name: 'City Explorers',
        size: 12
      },
      {
        name: 'Mountain Hikers',
        size: 4
      },
      {
        name: 'Lake District Friends',
        size: 5
      }
    ]);

    // ============ USER GROUPS ============
    const userGroups = await UserGroup.create([
      {
        userId: users[0]._id,
        groupId: groups[0]._id,
        role: 'admin'
      },
      {
        userId: users[1]._id,
        groupId: groups[0]._id,
        role: 'member'
      },
      {
        userId: users[2]._id,
        groupId: groups[0]._id,
        role: 'member'
      },
      {
        userId: users[2]._id,
        groupId: groups[1]._id,
        role: 'admin'
      },
      {
        userId: users[3]._id,
        groupId: groups[1]._id,
        role: 'member'
      },
      {
        userId: users[1]._id,
        groupId: groups[2]._id,
        role: 'admin'
      },
      {
        userId: users[4]._id,
        groupId: groups[2]._id,
        role: 'member'
      }
    ]);

    // ============ JOURNEYS ============
    const journeys = await Journey.create([
      {
        name: 'Find the Hidden Fountain',
        image: 'https://images.unsplash.com/photo-1552561895-697cd0d59b58',
        town: 'Geneva',
        description: 'A beautiful Renaissance fountain hidden in the old town of Geneva'
      },
      {
        name: 'Mont-Blanc Challenge',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        town: 'Chamonix',
        description: 'Hike to the top of Mont-Blanc, the highest peak in the Alps'
      },
      {
        name: 'Lake Geneva Sunset Walk',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        town: 'Geneva',
        description: 'Peaceful walk along the shores of Lake Geneva at sunset'
      },
      {
        name: 'Lausanne Street Art Tour',
        image:
          'https://static.lausanne-tourisme.ch/image/upload/w_1936,f_auto,q_auto/6yLenM0MZJ1YD3n1Gog3woVeV5M6vFA6ROnJ6qgj',
        town: 'Lausanne',
        description: 'Discover amazing street art and murals in Vieille Ville'
      }
    ]);

    console.log('✅ Created 4 journeys');

    // ============ STEPS ============
    const steps = await Step.create([
      // Steps for journey 0: Hidden Fountain
      {
        journeyId: journeys[0]._id,
        location: {
          type: 'Point',
          coordinates: [6.634878, 46.520841]
        },
        image: 'https://images.unsplash.com/photo-1552561895-697cd0d59b58',
        riddle: 'Look for the old water fountain in the heart of the old town'
      },
      {
        journeyId: journeys[0]._id,
        location: {
          type: 'Point',
          coordinates: [6.6352, 46.5206]
        },
        image: 'https://images.unsplash.com/photo-1469022563149-aa64e87c54a6',
        riddle: 'Find the Renaissance architecture near the cathedral'
      },
      // Steps for journey 1: Mont-Blanc Challenge
      {
        journeyId: journeys[1]._id,
        location: {
          type: 'Point',
          coordinates: [6.864791, 45.832408]
        },
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        riddle: 'Start your climb at the base of Mont-Blanc'
      },
      {
        journeyId: journeys[1]._id,
        location: {
          type: 'Point',
          coordinates: [6.8651, 45.833]
        },
        image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e',
        riddle: 'Reach the first shelter at 2000m altitude'
      },
      {
        journeyId: journeys[1]._id,
        location: {
          type: 'Point',
          coordinates: [6.8655, 45.8334]
        },
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        riddle: 'Stand at the summit and enjoy the panoramic views'
      },
      // Steps for journey 2: Lake Geneva Sunset Walk
      {
        journeyId: journeys[2]._id,
        location: {
          type: 'Point',
          coordinates: [6.640941, 46.443359]
        },
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        riddle: 'Begin your walk at the lake shore promenade'
      },
      {
        journeyId: journeys[2]._id,
        location: {
          type: 'Point',
          coordinates: [6.642, 46.442]
        },
        image: 'https://images.unsplash.com/photo-1469022563149-aa64e87c54a6',
        riddle: 'Watch the sunset over the Jura mountains'
      },
      // Steps for journey 3: Lausanne Street Art
      {
        journeyId: journeys[3]._id,
        location: {
          type: 'Point',
          coordinates: [6.143208, 46.204391]
        },
        image:
          'https://static.lausanne-tourisme.ch/image/upload/w_1936,f_auto,q_auto/6yLenM0MZJ1YD3n1Gog3woVeV5M6vFA6ROnJ6qgj',
        riddle: 'Find the colorful mural in the old town'
      },
      {
        journeyId: journeys[3]._id,
        location: {
          type: 'Point',
          coordinates: [6.1435, 46.2047]
        },
        image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b',
        riddle: 'Discover the street art beneath the historic buildings'
      },
      {
        journeyId: journeys[3]._id,
        location: {
          type: 'Point',
          coordinates: [6.1439, 46.205]
        },
        image: 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb',
        riddle: 'Capture the essence of urban creativity'
      }
    ]);

    // ============ USER JOURNEYS ============
    const userJourneys = await UserJourney.create([
      {
        userId: users[0]._id,
        journeyId: journeys[0]._id
      },
      {
        userId: users[1]._id,
        journeyId: journeys[0]._id
      },
      {
        userId: users[2]._id,
        journeyId: journeys[1]._id
      },
      {
        userId: users[3]._id,
        journeyId: journeys[1]._id
      },
      {
        userId: users[1]._id,
        journeyId: journeys[2]._id
      },
      {
        userId: users[4]._id,
        journeyId: journeys[2]._id
      },
      {
        userId: users[0]._id,
        journeyId: journeys[3]._id
      },
      {
        userId: users[3]._id,
        journeyId: journeys[3]._id
      }
    ]);

    // ============ RATINGS ============
    const ratings = await Rating.create([
      {
        userId: users[0]._id,
        journeyId: journeys[0]._id,
        rating: 5
      },
      {
        userId: users[1]._id,
        journeyId: journeys[0]._id,
        rating: 4
      },
      {
        userId: users[2]._id,
        journeyId: journeys[0]._id,
        rating: 3
      },
      {
        userId: users[1]._id,
        journeyId: journeys[2]._id,
        rating: 5
      },
      {
        userId: users[0]._id,
        journeyId: journeys[3]._id,
        rating: 4
      },
      {
        userId: users[3]._id,
        journeyId: journeys[3]._id,
        rating: 5
      },
      {
        userId: users[4]._id,
        journeyId: journeys[2]._id,
        rating: 4
      }
    ]);

    // ============ PARTICIPATIONS ============
    const participations = await Participation.create([
      // Journey 0: Hidden Fountain - Two users completed
      {
        journeyId: journeys[0]._id,
        userId: users[0]._id,
        status: 'completed'
      },
      {
        journeyId: journeys[0]._id,
        userId: users[1]._id,
        status: 'completed'
      },
      // Journey 0: One user running
      {
        journeyId: journeys[0]._id,
        userId: users[4]._id,
        status: 'running'
      },

      // Journey 1: Mont-Blanc - Couple completed
      {
        journeyId: journeys[1]._id,
        userId: users[2]._id,
        status: 'completed'
      },
      {
        journeyId: journeys[1]._id,
        userId: users[3]._id,
        status: 'completed'
      },
      // Journey 1: Solo user running
      {
        journeyId: journeys[1]._id,
        userId: users[0]._id,
        status: 'running'
      },

      // Journey 2: Lake Geneva - Different statuses
      {
        journeyId: journeys[2]._id,
        userId: users[1]._id,
        status: 'completed'
      },
      {
        journeyId: journeys[2]._id,
        userId: users[4]._id,
        status: 'running'
      },
      // Journey 2: Open invitation
      {
        journeyId: journeys[2]._id,
        userId: users[2]._id,
        status: 'open'
      },

      // Journey 3: Lausanne Street Art - Multiple users
      {
        journeyId: journeys[3]._id,
        userId: users[3]._id,
        status: 'completed'
      },
      {
        journeyId: journeys[3]._id,
        userId: users[0]._id,
        status: 'running'
      },
      {
        journeyId: journeys[3]._id,
        userId: users[1]._id,
        status: 'open'
      },
      // Solo user for this journey
      {
        journeyId: journeys[3]._id,
        userId: users[2]._id,
        status: 'completed'
      }
    ]);

    // ============ SCORES ============
    const scores = await Score.create([
      // Scores for completed participations
      {
        userId: participations[0].userId,
        participationId: participations[0]._id,
        journeyId: journeys[0]._id,
        score: 850,
        time: 45,
        distance: 2.5
      },
      {
        userId: participations[1].userId,
        participationId: participations[1]._id,
        journeyId: journeys[0]._id,
        score: 920,
        time: 38,
        distance: 2.5
      },
      {
        userId: participations[3].userId,
        participationId: participations[3]._id,
        journeyId: journeys[1]._id,
        score: 750,
        time: 720,
        distance: 15.8
      },
      {
        userId: participations[4].userId,
        participationId: participations[4]._id,
        journeyId: journeys[1]._id,
        score: 1050,
        time: 650,
        distance: 15.8
      },
      {
        userId: participations[6].userId,
        participationId: participations[6]._id,
        journeyId: journeys[2]._id,
        score: 920,
        time: 105,
        distance: 5.3
      },
      {
        userId: participations[7].userId,
        participationId: participations[7]._id,
        journeyId: journeys[2]._id,
        score: 880,
        time: 115,
        distance: 5.3
      },
      {
        userId: participations[9].userId,
        participationId: participations[9]._id,
        journeyId: journeys[3]._id,
        score: 795,
        time: 140,
        distance: 4.2
      },
      {
        userId: participations[12].userId,
        participationId: participations[12]._id,
        journeyId: journeys[3]._id,
        score: 750,
        time: 155,
        distance: 4.2
      }
    ]);

    console.log('Summary:');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${friends.length} friend relationships`);
    console.log(`   - ${groups.length} groups`);
    console.log(`   - ${userGroups.length} user-group memberships`);
    console.log(`   - ${journeys.length} journeys`);
    console.log(`   - ${steps.length} steps`);
    console.log(`   - ${userJourneys.length} user-journey records`);
    console.log(`   - ${ratings.length} ratings`);
    console.log(`   - ${participations.length} participations`);
    console.log(`   - ${scores.length} scores`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
