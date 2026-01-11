import express from 'express';
import mongoose from 'mongoose'; // Nécessaire pour valider les ObjectIds
import { Rating } from '../models/index.js';

const router = express.Router();

/**
 * 1. Create or Update Rating
 * POST /api/ratings
 */
router.post('/', async (req, res) => {
  try {
    // 1. Récupération des données (on accepte 'value' car c'est ce que Postman envoie)
    let { userId, journeyId, value } = req.body;

    // 2. Nettoyage des espaces vides (Trim)
    // Cela corrige l'erreur "Cast to ObjectId failed" si un espace traîne dans Postman
    if (userId) userId = userId.trim();
    if (journeyId) journeyId = journeyId.trim();

    // 3. Vérifications
    if (!userId || !journeyId || typeof value !== 'number') {
      return res.status(400).json({
        error: 'userId, journeyId et value (nombre) sont requis'
      });
    }

    // Vérification que les IDs sont au bon format MongoDB
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(journeyId)) {
      return res.status(400).json({ error: 'Format de userId ou journeyId invalide' });
    }

    // 4. Upsert : Met à jour si existe, sinon crée
    const rating = await Rating.findOneAndUpdate(
      { userId, journeyId }, // Critère de recherche
      { rating: value },     // Mise à jour (on enregistre 'value' dans le champ 'rating')
      { upsert: true, new: true, runValidators: true } // Options
    );

    res.status(201).json({
      message: 'Rating saved',
      rating: {
        id: rating._id,
        userId: rating.userId,
        journeyId: rating.journeyId,
        value: rating.rating, // On renvoie la valeur stockée
        createdAt: rating.createdAt
      }
    });
  } catch (error) {
    console.error(error); // Affiche l'erreur dans le terminal pour le débogage
    res.status(400).json({ error: error.message });
  }
});

/**
 * 2. Read Ratings
 * GET /api/ratings?journeyId=...
 */
router.get('/', async (req, res) => {
  try {
    const { journeyId, userId } = req.query;
    const filter = {};

    if (journeyId) filter.journeyId = journeyId;
    if (userId) filter.userId = userId;

    const ratings = await Rating.find(filter)
      .populate('userId', 'username')
      .sort({ createdAt: -1 });

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
 * 3. Get Average Rating
 * GET /api/ratings/average/:journeyId
 */
router.get('/average/:journeyId', async (req, res) => {
  try {
    const { journeyId } = req.params;

    // Vérification du format ID
    if (!mongoose.Types.ObjectId.isValid(journeyId)) {
        return res.status(400).json({ error: "Invalid journeyId format" });
    }

    const result = await Rating.aggregate([
      { $match: { journeyId: new mongoose.Types.ObjectId(journeyId) } },
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