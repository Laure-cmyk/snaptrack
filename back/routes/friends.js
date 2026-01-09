import express from 'express';
import { Friends, User } from '../models/index.js';

const router = express.Router();

/**
 * 0. GET /friends
 * -> liste brute de toutes les relations, pour debug/admin
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
 * 1. Create request (envoyer une demande d'ami)
 * POST /friends/requests
 */
router.post('/requests', async (req, res) => {
  try {
    const { userId, friendUserId } = req.body;

    if (!userId || !friendUserId) {
      return res.status(400).json({ error: 'userId et friendUserId sont requis' });
    }

    const friendship = await Friends.create({
      userId,
      friendId: friendUserId,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Friend request created',
      friendship: {
        id: friendship._id,
        userId: friendship.userId,
        friendUserId: friendship.friendId,
        status: friendship.status
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 2. Accept request
 * POST /friends/requests/:id/accept
 */
router.post('/requests/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;

    const friendship = await Friends.findByIdAndUpdate(id, { status: 'accepted' }, { new: true });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    res.json({
      message: 'Friend request accepted',
      friendship: {
        id: friendship._id,
        userId: friendship.userId,
        friendUserId: friendship.friendId,
        status: friendship.status
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 3. Refuse request
 * POST /friends/requests/:id/refuse
 */
router.post('/requests/:id/refuse', async (req, res) => {
  try {
    const { id } = req.params;

    const friendship = await Friends.findByIdAndUpdate(id, { status: 'refused' }, { new: true });

    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    res.json({
      message: 'Friend request refused',
      friendship: {
        id: friendship._id,
        userId: friendship.userId,
        friendUserId: friendship.friendId,
        status: friendship.status
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 6. List Unfriend (personnes qui ne sont pas encore mes amis)
 * GET /friends/unfriends/:userId
 *
 * MUST BE BEFORE /:userId routes to avoid matching "unfriends" as userId
 */
router.get('/unfriends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching unfriends for userId:', userId);

    const relations = await Friends.find({
      $or: [{ userId }, { friendId: userId }]
    });

    const linkedIds = new Set();
    linkedIds.add(userId);

    relations.forEach(rel => {
      linkedIds.add(rel.userId.toString());
      linkedIds.add(rel.friendId.toString());
    });

    const unfriends = await User.find({
      _id: { $nin: Array.from(linkedIds) }
    }).select('username email');

    const result = unfriends.map(u => ({
      userId: u._id,
      username: u.username,
      email: u.email
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5b. List pending friend requests (invitations recues)
 * GET /friends/:userId/pending
 *
 * MUST BE BEFORE /:userId to avoid matching "pending" as part of userId
 */
router.get('/:userId/pending', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching pending friend requests for userId:', userId);

    const pendingRequests = await Friends.find({
      status: 'pending',
      friendId: userId
    }).populate('userId', 'username');

    console.log('Found pending requests:', pendingRequests.length);

    const result = pendingRequests.map(f => ({
      friendshipId: f._id,
      senderId: f.userId._id,
      senderName: f.userId.username,
      status: f.status
    }));

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. List Friends (voir mes amis)
 * GET /friends/:userId
 *
 * This catches all GET /friends/:something, so must be LAST among GET routes
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching friends for userId:', userId);

    const friendships = await Friends.find({
      status: 'accepted',
      $or: [{ userId: userId }, { friendId: userId }]
    })
      .populate('userId', 'username')
      .populate('friendId', 'username');

    console.log('Found accepted friendships:', friendships.length);

    const result = friendships.map(f => {
      const isUserSender = f.userId._id.toString() === userId;
      const otherUser = isUserSender ? f.friendId : f.userId;

      return {
        friendshipId: f._id,
        friendId: otherUser._id,
        friendName: otherUser.username,
        status: f.status
      };
    });

    console.log('Returning friends:', result.length);
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
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
      id: req.params.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
