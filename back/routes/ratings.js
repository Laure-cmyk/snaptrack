import express from 'express';
import { Rating } from '../models/index.js';

const router = express.Router();

// GET all ratings
router.get('/', async (req, res) => {
  try {
    const ratings = await Rating.find()
      .populate('userId', 'username email')
      .populate('journeyId', 'title');
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1. Create Rating
 * POST /api/ratings
 *
 * Body JSON :
 * {
 *   "userId": "101",
 *   "targetId": "701",
 *   "value": 5
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, targetId, value } = req.body;

    // Vérifications simples
    if (!userId || !targetId || typeof value !== 'number') {
      return res.status(400).json({
        error: 'userId, targetId et value (number) sont requis',
      });
    }

    const rating = await Rating.create({
      userId,
      targetId,
      value,
    });

    res.status(201).json({
      message: 'Rating created',
      rating: {
        id: rating._id,
        userId: rating.userId,
        targetId: rating.targetId,
        value: rating.value,
        createdAt: rating.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 2. Read Ratings
 * GET /api/ratings?targetId=701&userId=101 (userId optionnel)
 *
 * Objectif : récupérer tous les ratings pour un élément (targetId),
 * éventuellement filtrés par userId.
 */
router.get('/', async (req, res) => {
  try {
    const { targetId, userId } = req.query;

    // On attend au minimum un targetId pour filtrer
    const filter = {};
    if (targetId) {
      filter.targetId = targetId;
    }
    if (userId) {
      filter.userId = userId;
    }

    const ratings = await Rating.find(filter)
      .populate('userId', 'username') // pour récupérer le username
      .sort({ createdAt: -1 });

    // On formate la réponse comme dans ton exemple
    const result = ratings.map((r) => ({
      id: r._id,
      userId: r.userId?._id ?? r.userId,
      username: r.userId?.username ?? null,
      value: r.value,
      createdAt: r.createdAt,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
