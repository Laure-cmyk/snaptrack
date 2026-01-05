import express from 'express';
import { Friends, User } from '../models/index.js'; // adapte "User" si besoin

const router = express.Router();

/**
 * 0. GET /friends
 * -> (optionnel) liste brute de toutes les relations, pour debug/admin
 */
router.get('/', async (req, res) => {
  try {
    const friends = await Friends.find()
      .populate('userId', 'username email')
      .populate('friendId', 'username email');
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1. Create request (envoyer une demande d’ami)
 * POST /friends/requests
 * Body :
 * {
 *   "userId": "CURRENT_USER_ID",
 *   "friendUserId": "TARGET_USER_ID"
 * }
 */
router.post('/requests', async (req, res) => {
  try {
    const { userId, friendUserId } = req.body;

    if (!userId || !friendUserId) {
      return res.status(400).json({ error: 'userId et friendUserId sont requis' });
    }

    // On crée une relation avec status "pending"
    const friendship = await Friends.create({
      userId,
      friendId: friendUserId, // champ dans ton modèle Friends
      status: 'pending',
    });

    res.status(201).json({
      message: 'Friend request created',
      friendship: {
        id: friendship._id,
        userId: friendship.userId,
        friendUserId: friendship.friendId,
        status: friendship.status,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 2. Accept request (accepter une demande d’ami)
 * POST /friends/requests/:id/accept
 */
router.post('/requests/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;

    const friendship = await Friends.findByIdAndUpdate(
      id,
      { status: 'accepted' },
      { new: true }
    );

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    res.json({
      message: 'Friend request accepted',
      friendship: {
        id: friendship._id,
        userId: friendship.userId,
        friendUserId: friendship.friendId,
        status: friendship.status,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 3. Refuse request (refuser une demande d’ami)
 * POST /friends/requests/:id/refuse
 * Ici on garde l’historique avec status "refused".
 * Si tu préfères supprimer, je te montre plus bas.
 */
router.post('/requests/:id/refuse', async (req, res) => {
  try {
    const { id } = req.params;

    const friendship = await Friends.findByIdAndUpdate(
      id,
      { status: 'refused' },
      { new: true }
    );

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    res.json({
      message: 'Friend request refused',
      friendship: {
        id: friendship._id,
        userId: friendship.userId,
        friendUserId: friendship.friendId,
        status: friendship.status,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 4. Delete friend (supprimer un ami)
 * DELETE /friends/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const friendship = await Friends.findByIdAndDelete(req.params.id);
    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }
    res.json({
      message: 'Friend deleted',
      id: req.params.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. List Friends (voir mes amis)
 * GET /friends/:userId
 *
 * Règle : trouver toutes les relations où userId apparaît
 * dans userId OU friendId, et status = "accepted".
 * Puis renvoyer l’autre personne + le statut.
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const friendships = await Friends.find({
      status: 'accepted',
      $or: [{ userId }, { friendId: userId }],
    })
      .populate('userId', 'username')
      .populate('friendId', 'username');

    const result = friendships.map((f) => {
      const isUserSender = f.userId._id.toString() === userId;
      const otherUser = isUserSender ? f.friendId : f.userId;

      return {
        friendshipId: f._id,
        friendId: otherUser._id,
        friendName: otherUser.username,
        status: f.status,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** * 5b. List pending friend requests (invitations reçues)
 * GET /friends/:userId/pending
 *
 * Règle : trouver toutes les relations où userId est friendId
 * (= demandes reçues) et status = "pending".
 */
router.get('/:userId/pending', async (req, res) => {
  try {
    const { userId } = req.params;

    const pendingRequests = await Friends.find({
      status: 'pending',
      friendId: userId, // demandes reçues (l'utilisateur est la cible)
    }).populate('userId', 'username');

    const result = pendingRequests.map((f) => ({
      friendshipId: f._id,
      senderId: f.userId._id,
      senderName: f.userId.username,
      status: f.status,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** * 6. List Unfriend (personnes qui ne sont pas encore mes amis)
 * GET /friends/unfriends/:userId
 *
 * Règle : tous les utilisateurs pour lesquels il n’existe
 * aucune relation Friends (ni userId, ni friendId) avec userId courant.
 */
router.get('/unfriends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Toutes les relations où l’utilisateur est impliqué
    const relations = await Friends.find({
      $or: [{ userId }, { friendId: userId }],
    });

    // 2. Construire la liste des IDs déjà liés (amis + pending + refused)
    const linkedIds = new Set();
    linkedIds.add(userId);

    relations.forEach((rel) => {
      linkedIds.add(rel.userId.toString());
      linkedIds.add(rel.friendId.toString());
    });

    // 3. Chercher tous les utilisateurs qui NE sont PAS dans ces IDs
    const unfriends = await User.find({
      _id: { $nin: Array.from(linkedIds) },
    }).select('username email');

    const result = unfriends.map((u) => ({
      userId: u._id,
      username: u.username,
      email: u.email,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
