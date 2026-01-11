import express from 'express';
import mongoose from 'mongoose';
import { Score, User } from '../models/index.js';

const router = express.Router();

/**
 * 0. GET /scores
 * -> liste de tous les scores
 * Option : ?journeyId=... ou ?userId=...
 *
 * Exemples :
 *   GET /api/scores
 *   GET /api/scores?journeyId=6820...
 *   GET /api/scores?userId=681f...
 */
router.get('/', async (req, res) => {
  try {
    const { journeyId, userId } = req.query;

    const filter = {};
    if (journeyId) filter.journeyId = journeyId;
    if (userId) filter.userId = userId;

    const scores = await Score.find(filter)
      .populate('userId', 'username email')
      .populate('journeyId', 'title');

    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1. SUMMARY : GET /scores/summary
 *
 * Objectif :
 * Récupérer les points / distances / temps obtenus par tous les utilisateurs,
 * classés par catégorie, avec filtres possibles.
 *
 * Query params :
 * - userId   -> filtrer sur un utilisateur
 * - journeyId -> filtrer sur un parcours
 * - category -> "score" | "distance" | "time" (optionnel)
 * - from     -> date min (YYYY-MM-DD)
 * - to       -> date max (YYYY-MM-DD)
 */
router.get('/summary', async (req, res) => {
  try {
    const { userId, journeyId, category, from, to } = req.query;

    const match = {};

    if (userId) {
      match.userId = userId;
    }

    if (journeyId) {
      match.journeyId = journeyId;
    }

    // Filtre sur la période (createdAt)
    if (from || to) {
      match.createdAt = {};
      if (from) {
        match.createdAt.$gte = new Date(from);
      }
      if (to) {
        // pour inclure la journée entière
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        match.createdAt.$lte = endDate;
      }
    }

    // Agrégation : regrouper par userId et sommer les 3 catégories
    const aggregation = await Score.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: { $ifNull: ['$score', 0] } },
          totalDistance: { $sum: { $ifNull: ['$distance', 0] } },
          totalTime: { $sum: { $ifNull: ['$time', 0] } }
        }
      }
    ]);

    // Récupérer les infos des utilisateurs
    const userIds = aggregation.map(item => item._id);
    const users = await User.find({ _id: { $in: userIds } }).select('username');
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Construire la réponse finale
    const summary = aggregation.map(item => {
      const userDoc = userMap.get(item._id.toString());

      // Structure de base avec toutes les catégories
      const categoriesAll = {
        score: item.totalScore,
        distance: item.totalDistance,
        time: item.totalTime
      };

      // Si ?category est fourni, on ne renvoie que cette clé
      let categories;
      if (category && ['score', 'distance', 'time'].includes(category)) {
        categories = {
          [category]: categoriesAll[category]
        };
      } else {
        categories = categoriesAll;
      }

      return {
        user: {
          id: item._id,
          username: userDoc ? userDoc.username : 'Unknown'
        },
        categories
      };
    });

    res.json({
      message: 'Score summary generated',
      summary
    });
  } catch (error) {
    console.error('Error in GET /scores/summary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. TOTALS : GET /scores/totals
 *
 * Objectif :
 * - Retourner les totaux globaux (tous utilisateurs)
 * - ou les totaux d’un utilisateur spécifique si ?userId=...
 *
 * Query params :
 * - userId (optionnel)
 */
router.get('/totals', async (req, res) => {
  try {
    const { userId } = req.query;

    const match = {};
    if (userId) {
      // Convert string to ObjectId for MongoDB matching
      match.userId = new mongoose.Types.ObjectId(userId);
    }

    const aggregation = await Score.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalScore: { $sum: { $ifNull: ['$score', 0] } },
          totalDistance: { $sum: { $ifNull: ['$distance', 0] } },
          totalTime: { $sum: { $ifNull: ['$time', 0] } }
        }
      }
    ]);

    let totals = {
      score: 0,
      distance: 0,
      time: 0
    };

    if (aggregation.length > 0) {
      totals = {
        score: aggregation[0].totalScore,
        distance: aggregation[0].totalDistance,
        time: aggregation[0].totalTime
      };
    }

    res.json({ totals });
  } catch (error) {
    console.error('Error in GET /scores/totals:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. (Optionnel) Leaderboard d’une journey
 * GET /scores/journey/:journeyId
 * -> tu peux garder ou supprimer selon ton besoin
 */
router.get('/journey/:journeyId', async (req, res) => {
  try {
    const { journeyId } = req.params;

    const scores = await Score.find({ journeyId })
      .populate('userId', 'username')
      .sort({ score: -1 });

    const result = scores.map(s => ({
      scoreId: s._id,
      userId: s.userId._id,
      username: s.userId.username,
      journeyId: s.journeyId,
      score: s.score
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. (Optionnel) Historique d’un utilisateur
 * GET /scores/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const scores = await Score.find({ userId })
      .populate('journeyId', 'title')
      .sort({ createdAt: -1 });

    const result = scores.map(s => ({
      scoreId: s._id,
      journeyId: s.journeyId._id,
      journeyTitle: s.journeyId.title,
      score: s.score,
      createdAt: s.createdAt
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. Ajouter / mettre à jour un score simple
 * POST /scores
 * Si l'utilisateur a déjà un score pour ce parcours, on ne garde que le meilleur
 */
router.post('/', async (req, res) => {
  try {
    const { userId, journeyId, score, distance, time } = req.body;

    if (!userId || !journeyId) {
      return res.status(400).json({ error: 'userId et journeyId sont requis' });
    }

    // Vérifier s'il existe déjà un score pour cet utilisateur et ce parcours
    const existingScore = await Score.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      journeyId: new mongoose.Types.ObjectId(journeyId)
    });

    if (existingScore) {
      // Si le nouveau score est meilleur, on met à jour
      const newScoreValue = typeof score === 'number' ? score : 0;

      if (newScoreValue > existingScore.score) {
        // Mettre à jour avec le meilleur score
        existingScore.score = newScoreValue;
        if (typeof distance === 'number') existingScore.distance = distance;
        if (typeof time === 'number') existingScore.time = time;
        existingScore.updatedAt = new Date();

        await existingScore.save();

        return res.status(200).json({
          message: 'Score amélioré !',
          score: existingScore,
          improved: true,
          previousScore: existingScore.score - (newScoreValue - existingScore.score)
        });
      } else {
        // Le nouveau score n'est pas meilleur, on garde l'ancien
        return res.status(200).json({
          message: 'Score existant conservé (meilleur)',
          score: existingScore,
          improved: false
        });
      }
    }

    // Pas de score existant, on crée un nouveau
    const data = { userId, journeyId };
    if (typeof score === 'number') data.score = score;
    if (typeof distance === 'number') data.distance = distance;
    if (typeof time === 'number') data.time = time;

    const newScore = await Score.create(data);

    res.status(201).json({
      message: 'Score created',
      score: newScore,
      improved: false
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 6. GET score by ID
 * GET /scores/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const score = await Score.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('journeyId', 'title');

    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }

    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 7. PUT update score by ID
 * PUT /scores/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const score = await Score.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }

    res.json(score);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 8. DELETE score
 * DELETE /scores/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const score = await Score.findByIdAndDelete(req.params.id);
    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }
    res.json({ message: 'Score deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 9. GET leaderboard - Top players and user position
 * GET /scores/leaderboard/global?userId=...&friendId=...
 * Returns top 3 players + the user's position + friend's position if not in top 3
 */
router.get('/leaderboard/global', async (req, res) => {
  try {
    const { userId, friendId } = req.query;

    // Aggregate scores by user - sum of best scores for each journey
    const userScores = await Score.aggregate([
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$score' }
        }
      },
      {
        $sort: { totalScore: -1 }
      }
    ]);

    // Get user details
    const leaderboard = await Promise.all(
      userScores.map(async (item, index) => {
        const user = await User.findById(item._id).select('username profilePicture');
        return {
          rank: index + 1,
          userId: item._id,
          username: user?.username || 'Unknown',
          profilePicture: user?.profilePicture || null,
          totalScore: item.totalScore
        };
      })
    );

    // Get top 3
    const top3 = leaderboard.slice(0, 3);

    // Find current user position
    let userPosition = null;
    if (userId) {
      const userIndex = leaderboard.findIndex(u => u.userId.toString() === userId);
      if (userIndex !== -1 && userIndex >= 3) {
        userPosition = leaderboard[userIndex];
      } else if (userIndex === -1) {
        // L'utilisateur n'a aucun score, créer une position pour lui
        const currentUser = await User.findById(userId).select('username profilePicture');
        if (currentUser) {
          userPosition = {
            rank: leaderboard.length + 1,
            userId: userId,
            username: currentUser.username,
            profilePicture: currentUser.profilePicture || null,
            totalScore: 0
          };
        }
      }
    }

    // Find friend position
    let friendPosition = null;
    if (friendId) {
      const friendIndex = leaderboard.findIndex(u => u.userId.toString() === friendId);
      if (friendIndex !== -1 && friendIndex >= 3) {
        friendPosition = leaderboard[friendIndex];
      } else if (friendIndex === -1) {
        // L'ami n'a aucun score, créer une position pour lui
        const friendUser = await User.findById(friendId).select('username profilePicture');
        if (friendUser) {
          friendPosition = {
            rank: leaderboard.length + 1,
            userId: friendId,
            username: friendUser.username,
            profilePicture: friendUser.profilePicture || null,
            totalScore: 0
          };
        }
      }
    }

    res.json({
      top3,
      userPosition,
      friendPosition
    });
  } catch (error) {
    console.error('Error in GET /scores/leaderboard/global:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
