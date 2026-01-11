import express from 'express';
import { UserJourney } from '../models/index.js';

const router = express.Router();

/**
 * 1. List User Journey (toutes les journeys et les utilisateurs dans chaque journey)
 *
 * GET /api/user-journeys
 * GET /api/user-journeys?userId=...&status=...
 *
 * Objectif : retourner une liste de journeys, et pour chacune la liste des utilisateurs associés.
 *
 * Exemple de réponse :
 * [
 *   {
 *     "journeyId": "701",
 *     "journeyName": "Onboarding Game A",
 *     "users": [
 *       { "userId": "101", "username": "Alice" },
 *       { "userId": "102", "username": "Bob" }
 *     ]
 *   },
 *   ...
 * ]
 */
router.get('/', async (req, res) => {
  try {
    const { userId, status } = req.query;

    const filter = {};

    // Filtrer par userId (optionnel)
    if (userId) {
      filter.userId = userId;
    }

    // Filtrer par status (optionnel, si tu as un champ status dans UserJourney)
    if (status) {
      filter.status = status;
    }

    // On récupère toutes les liaisons UserJourney qui matchent le filtre
    const userJourneys = await UserJourney.find(filter)
      .populate('userId', 'username')
      .populate('journeyId', 'name title code createdAt');

    // On regroupe par journeyId
    const journeyMap = new Map();

    userJourneys.forEach(uj => {
      if (!uj.journeyId || !uj.userId) return;

      const jId = uj.journeyId._id.toString();

      if (!journeyMap.has(jId)) {
        journeyMap.set(jId, {
          journeyId: uj.journeyId._id,
          journeyName: uj.journeyId.name || uj.journeyId.title || '',
          users: []
        });
      }

      const group = journeyMap.get(jId);

      group.users.push({
        userId: uj.userId._id,
        username: uj.userId.username
      });
    });

    const result = Array.from(journeyMap.values());

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* 2. GET user-journey by ID (détail brut d’une relation)
 * GET /api/user-journeys/:id */
router.get('/:id', async (req, res) => {
  try {
    const userJourney = await UserJourney.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('journeyId', 'title description');

    if (!userJourney) {
      return res.status(404).json({ error: 'UserJourney not found' });
    }

    res.json(userJourney);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. POST create new user-journey
 * POST /api/user-journeys
 *
 * Body typique :
 * {
 *   "userId": "...",
 *   "journeyId": "...",
 *   "status": "in-progress"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const userJourney = await UserJourney.create(req.body);
    res.status(201).json(userJourney);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* 4. PUT update user-journey
PUT /api/user-journeys/:id */
router.put('/:id', async (req, res) => {
  try {
    const userJourney = await UserJourney.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!userJourney) {
      return res.status(404).json({ error: 'UserJourney not found' });
    }
    res.json(userJourney);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 5. DELETE user-journey
 * DELETE /api/user-journeys/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const userJourney = await UserJourney.findByIdAndDelete(req.params.id);
    if (!userJourney) {
      return res.status(404).json({ error: 'UserJourney not found' });
    }
    res.json({ message: 'UserJourney deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
