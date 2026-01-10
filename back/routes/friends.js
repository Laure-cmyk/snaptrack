import express from 'express';
import mongoose from 'mongoose';
import { Friends, User } from '../models/index.js';

const router = express.Router();

// Helper to convert string ID to ObjectId if needed
function toObjectId(id) {
  if (!id) return null;
  const idStr = id.toString();
  if (mongoose.Types.ObjectId.isValid(idStr)) {
    return new mongoose.Types.ObjectId(idStr);
  }
  return null;
}

/**
 * 0. GET /friends
 * -> liste brute de toutes les relations, pour debug/admin
 */
router.get('/', async (req, res) => {
  try {
    const friends = await Friends.find();

    // Manual lookup for each friend relationship
    const result = await Promise.all(
      friends.map(async (f) => {
        const userObjId = toObjectId(f.userId);
        const friendObjId = toObjectId(f.friendId);

        const [user, friend] = await Promise.all([
          userObjId ? User.findById(userObjId).select('username email') : null,
          friendObjId ? User.findById(friendObjId).select('username email') : null,
        ]);

        return {
          _id: f._id,
          userId: user || { _id: f.userId, username: 'Unknown' },
          friendId: friend || { _id: f.friendId, username: 'Unknown' },
          status: f.status,
          requestedAt: f.requestedAt,
          acceptedAt: f.acceptedAt,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        };
      })
    );

    res.json(result);
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
 * 3b. List pending friend requests for a user
 * GET /friends/requests/pending/:userId
 *
 * Returns all pending friend requests where the user is the target (friendId)
 */
router.get('/requests/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Convert string to ObjectId for proper querying
    const userObjId = toObjectId(userId);
    if (!userObjId) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const pendingRequests = await Friends.find({
      friendId: userObjId,
      status: 'pending',
    });

    // Manual lookup since userId might be stored as string
    const result = await Promise.all(
      pendingRequests.map(async (f) => {
        const senderObjId = toObjectId(f.userId);
        const sender = senderObjId ? await User.findById(senderObjId).select('username') : null;

        return {
          id: f._id,
          name: sender?.username || 'Unknown',
          senderId: f.userId,
          type: 'invite',
          category: 'friend',
        };
      })
    );

    res.json(result.filter(r => r.name !== 'Unknown'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3c. List sent pending friend requests for a user
 * GET /friends/requests/sent/:userId
 *
 * Returns all pending friend requests where the user is the sender (userId)
 */
router.get('/requests/sent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Convert string to ObjectId for proper querying
    const userObjId = toObjectId(userId);
    if (!userObjId) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const sentRequests = await Friends.find({
      userId: userObjId,
      status: 'pending',
    });

    // Manual lookup to get recipient info
    const result = await Promise.all(
      sentRequests.map(async (f) => {
        const recipientObjId = toObjectId(f.friendId);
        const recipient = recipientObjId ? await User.findById(recipientObjId).select('username profilePicture') : null;

        return {
          id: f._id,
          name: recipient?.username || 'Unknown',
          recipientId: f.friendId,
          profilePicture: recipient?.profilePicture,
          type: 'pending-sent',
        };
      })
    );

    res.json(result.filter(r => r.name !== 'Unknown'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. Delete friend (supprimer un ami)
 * DELETE /friends/:id
 */
router.get('/unfriends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

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

    const pendingRequests = await Friends.find({
      status: 'pending',
      friendId: userId
    }).populate('userId', 'username');

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
 * GET /friends/list/:userId
 *
 * Règle : trouver toutes les relations où userId apparaît
 * dans userId OU friendId, et status = "accepted".
 * Puis renvoyer l'autre personne + le statut.
 */
router.get('/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Convert string to ObjectId for proper querying
    const userObjId = toObjectId(userId);

    if (!userObjId) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const friendships = await Friends.find({
      status: 'accepted',
      $or: [{ userId: userObjId }, { friendId: userObjId }],
    });

    // Manual lookup since userId/friendId might be strings instead of ObjectIds
    const result = await Promise.all(
      friendships.map(async (f) => {
        const friendUserIdStr = f.userId?.toString() || f.userId;
        const friendIdStr = f.friendId?.toString() || f.friendId;

        const isUserSender = friendUserIdStr === userId;
        const otherUserId = isUserSender ? friendIdStr : friendUserIdStr;

        // Lookup the other user - convert string ID to ObjectId
        const otherUserObjId = toObjectId(otherUserId);
        const otherUser = otherUserObjId ? await User.findById(otherUserObjId).select('username profilePicture') : null;

        return {
          friendshipId: f._id,
          friendId: otherUserId,
          friendName: otherUser?.username || 'Unknown',
          profilePicture: otherUser?.profilePicture,
          status: f.status,
        };
      })
    );

    res.json(result.filter(r => r.friendName !== 'Unknown'));
  } catch (error) {
    console.error('Error in /friends/list/:userId:', error);
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
