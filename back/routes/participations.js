import express from 'express';
import { Participation, User, Journey } from '../models/index.js';

const router = express.Router();

/**
 * 0. GET /participations
 * -> liste de toutes les participations
 * Option : ?journeyId=... pour filtrer sur une journey précise
 *
 * Exemple :
 *   GET /api/participations
 *   GET /api/participations?journeyId=6820a1b0f1...
 */
router.get('/', async (req, res) => {
  try {
    const { journeyId } = req.query;

    const filter = {};
    if (journeyId) {
      filter.journeyId = journeyId;
    }

    const participations = await Participation.find(filter)
      .populate('userId', 'username email')
      .populate('journeyId', 'title');

    res.json(participations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1. List participant (participants d’une journey)
 *
 * GET /participations/journey/:journeyId
 *
 * Objectif : retourner une liste simplifiée :
 * [
 *   { "userId": 1, "username": "Alice", "journeyId": 3 },
 *   ...
 * ]
 */
router.get('/journey/:journeyId', async (req, res) => {
  try {
    const { journeyId } = req.params;

    const participations = await Participation.find({ journeyId })
      .populate('userId', 'username')
      .populate('journeyId', '_id'); // juste pour vérifier

    const result = participations.map((p) => ({
      userId: p.userId._id,
      username: p.userId.username,
      journeyId: p.journeyId._id,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Add participant
 *
 * POST /participations
 *
 * Body :
 * {
 *   "userId": "...",
 *   "journeyId": "..."
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, journeyId } = req.body;

    if (!userId || !journeyId) {
      return res
        .status(400)
        .json({ error: 'userId et journeyId sont requis' });
    }

    // (Optionnel) vérifier si la participation existe déjà
    const existing = await Participation.findOne({ userId, journeyId });
    if (existing) {
      return res.status(409).json({
        error: 'Participant already registered for this journey',
      });
    }

    const participation = await Participation.create({ userId, journeyId });

    res.status(201).json({
      message: 'Participant added',
      participation: {
        _id: participation._id,
        userId: participation.userId,
        journeyId: participation.journeyId,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 3. Remove participant (par userId + journeyId)
 *
 * DELETE /participations?userId=...&journeyId=...
 *
 * Objectif : retirer un utilisateur d’une journey.
 */
router.delete('/', async (req, res) => {
  try {
    const { userId, journeyId } = req.query;

    if (!userId || !journeyId) {
      return res
        .status(400)
        .json({ error: 'userId et journeyId sont requis dans la query' });
    }

    const deleted = await Participation.findOneAndDelete({ userId, journeyId });

    if (!deleted) {
      return res
        .status(404)
        .json({ error: 'Participation not found for this user/journey' });
    }

    res.json({
      message: 'Participant removed',
      userId,
      journeyId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. GET participation by ID (détail brut)
 * GET /participations/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const participation = await Participation.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('journeyId', 'title');
    if (!participation) {
      return res.status(404).json({ error: 'Participation not found' });
    }
    res.json(participation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. PUT update participation (si tu en as besoin)
 * PUT /participations/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const participation = await Participation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!participation) {
      return res.status(404).json({ error: 'Participation not found' });
    }
    res.json(participation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 6. DELETE participation par ID
 * DELETE /participations/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const participation = await Participation.findByIdAndDelete(
      req.params.id
    );
    if (!participation) {
      return res.status(404).json({ error: 'Participation not found' });
    }
    res.json({ message: 'Participation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
