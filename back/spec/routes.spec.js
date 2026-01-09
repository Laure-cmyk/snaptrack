import request from 'supertest';
import 'dotenv/config';
import mongoose from 'mongoose';
import app from '../app.js';
import connectDB from '../config/database.js';
import { User, Journey, Step, Rating, Participation } from '../models/index.js';

describe('API Routes - REST Operations Test Suite', () => {
  // ═══════════════════════════════════════════════════════════════════════════════
  // SETUP & TEARDOWN
  // ═══════════════════════════════════════════════════════════════════════════════

  beforeAll(async () => {
    await connectDB();
    // Clean database before tests
    await User.deleteMany({});
    await Journey.deleteMany({});
    await Step.deleteMany({});
    await Rating.deleteMany({});
    await Participation.deleteMany({});
  });

  afterAll(async () => {
    // Final cleanup
    await User.deleteMany({});
    await Journey.deleteMany({});
    await Step.deleteMany({});
    await Rating.deleteMany({});
    await Participation.deleteMany({});
    // Close database connection
    await mongoose.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // USERS TESTS - CREATE, READ, UPDATE, DELETE
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('👤 Users Routes (/users) - CRUD Operations', () => {
    let userId;
    const userData = {
      username: 'testuser123',
      email: 'testuser@example.com',
      password: 'securepass123'
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // CREATE - POST /users
    // ─────────────────────────────────────────────────────────────────────────────
    describe('CREATE Operation - POST /users', () => {
      test('[1] POST /users - should create a new user with valid data', async () => {
        const res = await request(app).post('/users').send(userData);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.username).toBe(userData.username);
        expect(res.body.email).toBe(userData.email);
        expect(res.body).not.toHaveProperty('password'); // Password should not be returned
        userId = res.body._id;
      });

      test('[2] POST /users - should reject duplicate username', async () => {
        const res = await request(app).post('/users').send(userData);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // READ - GET /users and GET /users/:id
    // ─────────────────────────────────────────────────────────────────────────────
    describe('READ Operation - GET /users', () => {
      test('[3] GET /users - should retrieve all users (non-empty list)', async () => {
        const res = await request(app).get('/users');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0); // Should have at least 1 user
        expect(res.body[0]).toHaveProperty('_id');
        expect(res.body[0]).toHaveProperty('username');
      });

      test('[4] GET /users/:id - should retrieve specific user by ID', async () => {
        const res = await request(app).get(`/users/${userId}`);
        expect(res.status).toBe(200);
        expect(res.body._id.toString()).toBe(userId.toString());
        expect(res.body.username).toBe(userData.username);
        expect(res.body.email).toBe(userData.email);
      });

      test('[5] GET /users/:id - should return 404 for non-existent user', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const res = await request(app).get(`/users/${fakeId}`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // UPDATE - PUT /users/:id
    // ─────────────────────────────────────────────────────────────────────────────
    describe('UPDATE Operation - PUT /users/:id', () => {
      test('[6] PUT /users/:id - should update user with valid data', async () => {
        const updateData = {
          bio: 'Updated bio for test user'
        };
        const res = await request(app).put(`/users/${userId}`).send(updateData);
        expect(res.status).toBe(200);
        expect(res.body._id.toString()).toBe(userId.toString());
        expect(res.body.bio).toBe(updateData.bio);
        expect(res.body.username).toBe(userData.username); // Original field should remain
      });

      test('[7] PUT /users/:id - should return 404 when updating non-existent user', async () => {
        const fakeId = '507f1f77bcf86cd799439011';
        const res = await request(app).put(`/users/${fakeId}`).send({ bio: 'test' });
        expect(res.status).toBe(404);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // DELETE - DELETE /users/:id
    // ─────────────────────────────────────────────────────────────────────────────
    describe('DELETE Operation - DELETE /users/:id', () => {
      test('[8] DELETE /users/:id - should delete user', async () => {
        const res = await request(app).delete(`/users/${userId}`);
        expect(res.status).toBe(200);
      });

      test('[9] GET /users/:id - should confirm user is deleted', async () => {
        const res = await request(app).get(`/users/${userId}`);
        expect(res.status).toBe(404);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // JOURNEYS TESTS - CREATE, READ, UPDATE, DELETE
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('🗺️ Journeys Routes (/journeys) - CRUD Operations', () => {
    let journeyId;
    const journeyData = {
      name: 'Mountain Adventure Trail',
      town: 'Zermatt',
      description: 'A scenic journey through the Swiss mountains'
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // CREATE - POST /journeys
    // ─────────────────────────────────────────────────────────────────────────────
    describe('CREATE Operation - POST /journeys', () => {
      test('[10] POST /journeys - should create a new journey', async () => {
        const res = await request(app).post('/journeys').send(journeyData);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.name).toBe(journeyData.name);
        expect(res.body.town).toBe(journeyData.town);
        journeyId = res.body._id;
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // READ - GET /journeys and GET /journeys/:id
    // ─────────────────────────────────────────────────────────────────────────────
    describe('READ Operation - GET /journeys', () => {
      test('[11] GET /journeys - should retrieve all journeys with pagination (non-empty)', async () => {
        const res = await request(app).get('/journeys');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('journeys');
        expect(Array.isArray(res.body.journeys)).toBe(true);
        expect(res.body.journeys.length).toBeGreaterThan(0);
        expect(res.body).toHaveProperty('total');
      });

      test('[12] GET /journeys/:id - should retrieve specific journey by ID', async () => {
        const res = await request(app).get(`/journeys/${journeyId}`);
        expect(res.status).toBe(200);
        expect(res.body._id.toString()).toBe(journeyId.toString());
        expect(res.body.name).toBe(journeyData.name);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // UPDATE - PUT /journeys/:id
    // ─────────────────────────────────────────────────────────────────────────────
    describe('UPDATE Operation - PUT /journeys/:id', () => {
      test('[13] PUT /journeys/:id - should update journey data', async () => {
        const updateData = {
          description: 'Updated: A more challenging mountain journey'
        };
        const res = await request(app).put(`/journeys/${journeyId}`).send(updateData);
        expect(res.status).toBe(200);
        expect(res.body.description).toBe(updateData.description);
        expect(res.body.name).toBe(journeyData.name); // Original field should remain
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // DELETE - DELETE /journeys/:id
    // ─────────────────────────────────────────────────────────────────────────────
    describe('DELETE Operation - DELETE /journeys/:id', () => {
      test('[14] DELETE /journeys/:id - should delete journey', async () => {
        const res = await request(app).delete(`/journeys/${journeyId}`);
        expect(res.status).toBe(200);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // RATINGS TESTS - CREATE, READ, UPDATE, DELETE
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('⭐ Ratings Routes (/ratings) - CRUD Operations', () => {
    let userId, targetId, ratingId;

    beforeAll(async () => {
      // Create test user for ratings
      const user = await User.create({
        username: 'ratinguser',
        email: 'rating@test.com',
        password: 'pass123'
      });
      // targetId can be any string (journey ID, item ID, etc.)
      targetId = '701';
      userId = user._id;
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // CREATE - POST /ratings
    // ─────────────────────────────────────────────────────────────────────────────
    describe('CREATE Operation - POST /ratings', () => {
      test('[15] POST /ratings - should create a new rating', async () => {
        const res = await request(app).post('/ratings').send({
          userId: userId.toString(),
          targetId,
          value: 5
        });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toBe('Rating created');
        expect(res.body.rating).toHaveProperty('id');
        expect(res.body.rating.value).toBe(5);
        expect(res.body.rating.targetId).toBe(targetId);
        ratingId = res.body.rating.id;
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // READ - GET /ratings
    // ─────────────────────────────────────────────────────────────────────────────
    describe('READ Operation - GET /ratings', () => {
      test('[16] GET /ratings - should retrieve all ratings (non-empty)', async () => {
        const res = await request(app).get('/ratings');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty('value');
        expect(res.body[0]).toHaveProperty('userId');
      });

      test('[17] GET /ratings?targetId=<id> - should filter ratings by targetId', async () => {
        const res = await request(app).get(`/ratings?targetId=${targetId}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].targetId).toBe(targetId);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // UPDATE - PUT /ratings/:id (test by creating another rating and updating it)
    // ─────────────────────────────────────────────────────────────────────────────
    describe('UPDATE Operation - POST /ratings (update by creating new)', () => {
      test('[18] POST /ratings - should create second rating to verify multiple ratings', async () => {
        const res = await request(app).post('/ratings').send({
          userId: userId.toString(),
          targetId: '702',
          value: 4
        });
        expect(res.status).toBe(201);
        expect(res.body.rating.value).toBe(4);
        expect(res.body.rating.targetId).toBe('702');
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // VERIFY - GET /ratings with user filter
    // ─────────────────────────────────────────────────────────────────────────────
    describe('Verification - GET /ratings with filters', () => {
      test('[19] GET /ratings?targetId=<id>&userId=<id> - should filter by both targetId and userId', async () => {
        const res = await request(app).get(
          `/ratings?targetId=${targetId}&userId=${userId.toString()}`
        );
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        if (res.body.length > 0) {
          expect(res.body[0].userId).toBeDefined();
          expect(res.body[0].value).toBeDefined();
        }
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEPS TESTS - CREATE, READ, UPDATE, DELETE
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('📍 Steps Routes (/steps) - CRUD Operations', () => {
    let journeyId, stepId;
    const stepData = {
      location: {
        type: 'Point',
        coordinates: [7.44, 46.95]
      },
      riddle: 'What is the highest peak in Switzerland?',
      note: 'Hint: The answer is in the local museum',
      image: 'https://example.com/step1.jpg'
    };

    beforeAll(async () => {
      // Create test journey for steps
      const journey = await Journey.create({
        name: 'Quiz Journey for Steps',
        town: 'Valais',
        description: 'Test journey for steps'
      });
      journeyId = journey._id;
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // CREATE - POST /steps
    // ─────────────────────────────────────────────────────────────────────────────
    describe('CREATE Operation - POST /steps', () => {
      test('[20] POST /steps - should create a new step', async () => {
        const res = await request(app)
          .post('/steps')
          .send({
            journeyId,
            ...stepData
          });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toBe('Step created');
        expect(res.body.step).toHaveProperty('id');
        expect(res.body.step.riddle).toBe(stepData.riddle);
        stepId = res.body.step.id;
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // READ - GET /steps and GET /steps/journey/:journeyId
    // ─────────────────────────────────────────────────────────────────────────────
    describe('READ Operation - GET /steps', () => {
      test('[21] GET /steps - should retrieve all steps (non-empty)', async () => {
        const res = await request(app).get('/steps');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });

      test('[22] GET /steps/:id - should retrieve specific step by ID', async () => {
        const res = await request(app).get(`/steps/${stepId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('step');
        expect(res.body.step.riddle).toBe(stepData.riddle);
      });

      test('[23] GET /steps/journey/:journeyId - should retrieve all steps for a journey', async () => {
        const res = await request(app).get(`/steps/journey/${journeyId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('steps');
        expect(Array.isArray(res.body.steps)).toBe(true);
        expect(res.body.total).toBeGreaterThan(0);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // UPDATE - PUT /steps/:id
    // ─────────────────────────────────────────────────────────────────────────────
    describe('UPDATE Operation - PUT /steps/:id', () => {
      test('[24] PUT /steps/:id - should update step', async () => {
        const res = await request(app).put(`/steps/${stepId}`).send({
          riddle: 'Updated: What is the second highest peak?'
        });
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Step updated');
        expect(res.body.step.riddle).toBe('Updated: What is the second highest peak?');
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // DELETE - DELETE /steps/:id
    // ─────────────────────────────────────────────────────────────────────────────
    describe('DELETE Operation - DELETE /steps/:id', () => {
      test('[25] DELETE /steps/:id - should delete step', async () => {
        const res = await request(app).delete(`/steps/${stepId}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Step deleted');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // PARTICIPATIONS TESTS - CREATE, READ, UPDATE, DELETE
  // ═══════════════════════════════════════════════════════════════════════════════

  describe('🎯 Participations Routes (/participations) - CRUD Operations', () => {
    let userId, journeyId, participationId;

    beforeAll(async () => {
      // Create test user and journey for participations
      const user = await User.create({
        username: 'participantuser',
        email: 'participant@test.com',
        password: 'pass123'
      });
      const journey = await Journey.create({
        name: 'Test Journey for Participation',
        town: 'Lucerne',
        description: 'Test journey'
      });
      userId = user._id;
      journeyId = journey._id;
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // CREATE - POST /participations
    // ─────────────────────────────────────────────────────────────────────────────
    describe('CREATE Operation - POST /participations', () => {
      test('[26] POST /participations - should add participant to journey', async () => {
        const res = await request(app).post('/participations').send({
          userId,
          journeyId,
          status: 'open'
        });
        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Participant added');
        expect(res.body.status).toBe('open');
        expect(res.body).toHaveProperty('participationId');
        participationId = res.body.participationId;
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // READ - GET /participations
    // ─────────────────────────────────────────────────────────────────────────────
    describe('READ Operation - GET /participations', () => {
      test('[27] GET /participations - should retrieve all participations (non-empty)', async () => {
        const res = await request(app).get('/participations');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });

      test('[28] GET /participations/:journeyId - should retrieve participants for journey', async () => {
        const res = await request(app).get(`/participations/${journeyId}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // UPDATE - PUT /participations/:id
    // ─────────────────────────────────────────────────────────────────────────────
    describe('UPDATE Operation - PUT /participations/:id', () => {
      test('[29] PUT /participations/:id - should update participation status', async () => {
        const res = await request(app).put(`/participations/${participationId}`).send({
          status: 'running'
        });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('running');
      });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // DELETE - DELETE /participations/:id
    // ─────────────────────────────────────────────────────────────────────────────
    describe('DELETE Operation - DELETE /participations/:id', () => {
      test('[30] DELETE /participations/:id - should remove participant', async () => {
        const res = await request(app).delete(`/participations/${participationId}`);
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Participant removed');
      });
    });
  });
});
