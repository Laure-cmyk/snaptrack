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

// ==========================================
// DÉFINITION DES SCHÉMAS (COMPONENTS)
// ==========================================

/**
 * @swagger
 * {
 * "components": {
 * "schemas": {
 * "Friendship": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string", "description": "ID unique de la relation" },
 * "userId": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string" },
 * "username": { "type": "string" }
 * }
 * },
 * "friendId": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string" },
 * "username": { "type": "string" }
 * }
 * },
 * "status": {
 * "type": "string",
 * "enum": ["pending", "accepted", "refused"],
 * "description": "État de la demande"
 * },
 * "createdAt": { "type": "string", "format": "date-time" }
 * }
 * },
 * "NewFriendRequest": {
 * "type": "object",
 * "required": ["userId", "friendUserId"],
 * "properties": {
 * "userId": {
 * "type": "string",
 * "description": "ID de l'utilisateur qui envoie la demande",
 * "example": "60d0fe4f5311236168a109ca"
 * },
 * "friendUserId": {
 * "type": "string",
 * "description": "ID de l'utilisateur qui reçoit la demande",
 * "example": "60d0fe4f5311236168a109cb"
 * }
 * }
 * }
 * }
 * }
 * }
 */

// ==========================================
// ROUTES
// ==========================================

/**
 * @swagger
 * {
 * "paths": {
 * "/friends": {
 * "get": {
 * "summary": "Récupérer toutes les relations (Admin/Debug)",
 * "description": "Renvoie une liste brute de toutes les amitiés existantes.",
 * "tags": ["Friends"],
 * "responses": {
 * "200": {
 * "description": "Liste récupérée avec succès",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/Friendship" }
 * }
 * }
 * }
 * },
 * "500": { "description": "Erreur serveur interne" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/', async (req, res) => {
  try {
    const friends = await Friends.find();

    const result = await Promise.all(
      friends.map(async f => {
        const userObjId = toObjectId(f.userId);
        const friendObjId = toObjectId(f.friendId);

        const [user, friend] = await Promise.all([
          userObjId ? User.findById(userObjId).select('username email') : null,
          friendObjId ? User.findById(friendObjId).select('username email') : null
        ]);

        return {
          _id: f._id,
          userId: user || { _id: f.userId, username: 'Unknown' },
          friendId: friend || { _id: f.friendId, username: 'Unknown' },
          status: f.status,
          requestedAt: f.requestedAt,
          acceptedAt: f.acceptedAt,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt
        };
      })
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/friends/requests": {
 * "post": {
 * "summary": "Créer une demande d'ami",
 * "tags": ["Friends"],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/NewFriendRequest" }
 * }
 * }
 * },
 * "responses": {
 * "201": {
 * "description": "Demande créée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "friendship": {
 * "type": "object",
 * "properties": {
 * "id": { "type": "string" },
 * "status": { "type": "string" }
 * }
 * }
 * }
 * }
 * }
 * }
 * },
 * "400": { "description": "Données manquantes" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
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
 * @swagger
 * {
 * "paths": {
 * "/friends/requests/{id}/accept": {
 * "post": {
 * "summary": "Accepter une demande d'ami",
 * "tags": ["Friends"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e41d5f42f536195f29c91"
 * },
 * "description": "L'ID de la relation"
 * }
 * ],
 * "responses": {
 * "200": { "description": "Demande acceptée" },
 * "404": { "description": "Demande introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
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
 * @swagger
 * {
 * "paths": {
 * "/friends/requests/{id}/refuse": {
 * "post": {
 * "summary": "Refuser une demande d'ami",
 * "tags": ["Friends"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e41d5f42f536195f29c8e"
 * },
 * "description": "L'ID de la relation"
 * }
 * ],
 * "responses": {
 * "200": { "description": "Demande refusée" },
 * "404": { "description": "Demande introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
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
 * @swagger
 * {
 * "paths": {
 * "/friends/requests/pending/{userId}": {
 * "get": {
 * "summary": "Voir les demandes reçues (Invitation entrante)",
 * "tags": ["Friends"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "userId",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e41d5f42f536195f29c7e"
 * }
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Liste des invitations reçues",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": {
 * "type": "object",
 * "properties": {
 * "id": { "type": "string" },
 * "name": { "type": "string" },
 * "senderId": { "type": "string" },
 * "type": { "type": "string" },
 * "category": { "type": "string" }
 * }
 * }
 * }
 * }
 * }
 * },
 * "400": { "description": "Format d'ID invalide" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/requests/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userObjId = toObjectId(userId);
    if (!userObjId) return res.status(400).json({ error: 'Invalid userId format' });

    const pendingRequests = await Friends.find({
      friendId: userObjId,
      status: 'pending'
    });

    const result = await Promise.all(
      pendingRequests.map(async f => {
        const senderObjId = toObjectId(f.userId);
        const sender = senderObjId ? await User.findById(senderObjId).select('username') : null;

        return {
          id: f._id,
          name: sender?.username || 'Unknown',
          senderId: f.userId,
          type: 'invite',
          category: 'friend'
        };
      })
    );

    res.json(result.filter(r => r.name !== 'Unknown'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/friends/requests/pending/{userId}": {
 * "get": {
 * "summary": "Voir les demandes reçues (Invitation entrante)",
 * "tags": ["Friends"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "userId",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e41d5f42f536195f29c7e"
 * }
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Liste des invitations reçues",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": {
 * "type": "object",
 * "properties": {
 * "id": { "type": "string" },
 * "name": { "type": "string" },
 * "senderId": { "type": "string" },
 * "type": { "type": "string" },
 * "category": { "type": "string" }
 * }
 * }
 * }
 * }
 * }
 * },
 * "400": { "description": "Format d'ID invalide" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/requests/sent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userObjId = toObjectId(userId);
    if (!userObjId) return res.status(400).json({ error: 'Invalid userId format' });

    const sentRequests = await Friends.find({
      userId: userObjId,
      status: 'pending'
    });

    const result = await Promise.all(
      sentRequests.map(async f => {
        const recipientObjId = toObjectId(f.friendId);
        const recipient = recipientObjId
          ? await User.findById(recipientObjId).select('username profilePicture')
          : null;

        return {
          id: f._id,
          name: recipient?.username || 'Unknown',
          recipientId: f.friendId,
          profilePicture: recipient?.profilePicture,
          type: 'pending-sent'
        };
      })
    );

    res.json(result.filter(r => r.name !== 'Unknown'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/friends/unfriends/{userId}": {
 * "get": {
 * "summary": "Suggestions d'amis (Utilisateurs non liés)",
 * "tags": ["Friends"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "userId",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e41d5f42f536195f29c7e"
 * }
 * }
 * ],
 * "responses": {
 * "200": { "description": "Liste des suggestions" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
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
 * @swagger
 * {
 * "paths": {
 * "/friends/{userId}/pending": {
 * "get": {
 * "summary": "Liste alternative des invitations reçues",
 * "tags": ["Friends"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "userId",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e41d5f42f536195f29c7e"
 * }
 * }
 * ],
 * "responses": {
 * "200": { "description": "Liste des invitations" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
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
 * @swagger
 * {
 * "paths": {
 * "/friends/list/{userId}": {
 * "get": {
 * "summary": "Liste des amis (Acceptés)",
 * "tags": ["Friends"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "userId",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e41d5f42f536195f29c7d"
 * }
 * }
 * ],
 * "responses": {
 * "200": { "description": "Liste des amis" },
 * "400": { "description": "Format d'ID invalide" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userObjId = toObjectId(userId);

    if (!userObjId) return res.status(400).json({ error: 'Invalid userId format' });

    const friendships = await Friends.find({
      status: 'accepted',
      $or: [{ userId: userObjId }, { friendId: userObjId }]
    });

    const result = await Promise.all(
      friendships.map(async f => {
        const friendUserIdStr = f.userId?.toString() || f.userId;
        const friendIdStr = f.friendId?.toString() || f.friendId;

        const isUserSender = friendUserIdStr === userId;
        const otherUserId = isUserSender ? friendIdStr : friendUserIdStr;

        const otherUserObjId = toObjectId(otherUserId);
        const otherUser = otherUserObjId
          ? await User.findById(otherUserObjId).select('username profilePicture')
          : null;

        return {
          friendshipId: f._id,
          friendId: otherUserId,
          friendName: otherUser?.username || 'Unknown',
          profilePicture: otherUser?.profilePicture,
          status: f.status
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
 * @swagger
 * {
 * "paths": {
 * "/friends/{id}": {
 * "delete": {
 * "summary": "Supprimer un ami ou une relation",
 * "tags": ["Friends"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e41d5f42f536195f29c8f"
 * }
 * }
 * ],
 * "responses": {
 * "200": { "description": "Relation supprimée" },
 * "404": { "description": "Relation introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
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
