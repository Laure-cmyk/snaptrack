import express from 'express';
import { Rating } from '../models/index.js';

const router = express.Router();

/**
 * 1. Create Rating
 * POST /api/ratings
 *
 * Body JSON :
 * {
 *   "userId": "...",
 *   "journeyId": "...",
 *   "rating": 5
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, journeyId, rating: ratingValue } = req.body;

    // Vérifications simples
    if (!userId || !journeyId || typeof ratingValue !== 'number') {
      return res.status(400).json({
        error: 'userId, journeyId et rating (number) sont requis'
      });
    }

    // Upsert: update if exists, create if not
    const rating = await Rating.findOneAndUpdate(
      { userId, journeyId },
      { rating: ratingValue },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({
      message: 'Rating saved',
      rating: {
        id: rating._id,
        userId: rating.userId,
        journeyId: rating.journeyId,
        rating: rating.rating,
        createdAt: rating.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 2. Read Ratings
 * GET /api/ratings?journeyId=...&userId=... (userId optionnel)
 *
 * Objectif : récupérer tous les ratings pour un élément (journeyId),
 * éventuellement filtrés par userId.
 */
router.get('/', async (req, res) => {
  try {
    const { journeyId, userId } = req.query;

    // On attend au minimum un journeyId pour filtrer
    const filter = {};
    if (journeyId) {
      filter.journeyId = journeyId;
    }
    if (userId) {
      filter.userId = userId;
    }

    const ratings = await Rating.find(filter)
      .populate('userId', 'username') // pour récupérer le username
      .sort({ createdAt: -1 });

    // On formate la réponse comme dans ton exemple
    const result = ratings.map(r => ({
      id: r._id,
      userId: r.userId?._id ?? r.userId,
      username: r.userId?.username ?? null,
      rating: r.rating,
      createdAt: r.createdAt
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Get Average Rating for a Journey
 * GET /api/ratings/average/:journeyId
 */
router.get('/average/:journeyId', async (req, res) => {
  try {
    const { journeyId } = req.params;

    const result = await Rating.aggregate([
      { $match: { journeyId: new (await import('mongoose')).default.Types.ObjectId(journeyId) } },
      { $group: { _id: '$journeyId', averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (result.length === 0) {
      return res.json({ journeyId, averageRating: 0, count: 0 });
    }

    res.json({
      journeyId,
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      count: result[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
