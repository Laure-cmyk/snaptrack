import express from 'express';
import mongoose from 'mongoose';
import { Group, UserGroup, User } from '../models/index.js';

const router = express.Router();

// Helper function to convert string ID to ObjectId
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
 * "Group": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string", "description": "ID unique du groupe" },
 * "name": { "type": "string", "description": "Nom du groupe" },
 * "createdBy": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string" },
 * "username": { "type": "string" },
 * "email": { "type": "string" }
 * }
 * },
 * "createdAt": { "type": "string", "format": "date-time" },
 * "updatedAt": { "type": "string", "format": "date-time" }
 * }
 * },
 * "GroupInput": {
 * "type": "object",
 * "required": ["name"],
 * "properties": {
 * "name": { "type": "string", "example": "Team Bleu" },
 * "size": { "type": "string", "description": "ID de l'utilisateur créateur (optionnel)", "example": "5" }
 * }
 * },
 * "GroupMember": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string" },
 * "username": { "type": "string" },
 * "profilePicture": { "type": "string" }
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
 * "/groups": {
 * "get": {
 * "summary": "Lister tous les groupes (Admin/Debug)",
 * "tags": ["Groups"],
 * "responses": {
 * "200": {
 * "description": "Liste de tous les groupes existants",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/Group" }
 * }
 * }
 * }
 * },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "post": {
 * "summary": "Créer un nouveau groupe",
 * "tags": ["Groups"],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": {
 * "$ref": "#/components/schemas/GroupInput",
 * "example": {
 * "name": "Explorateurs",
 * "ownerId": "695e75de8f7bb279fd390dde"
 * }
 * }
 * }
 * }
 * },
 * "responses": {
 * "201": {
 * "description": "Groupe créé avec succès",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "group": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string" },
 * "name": { "type": "string" },
 * "ownerId": { "type": "string" },
 * "createdAt": { "type": "string", "format": "date-time" }
 * }
 * }
 * }
 * }
 * }
 * }
 * },
 * "400": { "description": "Nom du groupe manquant ou invalide" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find().populate('createdBy', 'username email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    // On récupère "ownerId" (l'ID de l'utilisateur) au lieu de "size"
    const { name, ownerId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Le champ "name" est requis' });
    }

    const groupData = { name };

    // Si un ownerId est fourni, on l'assigne à createdBy
    if (ownerId) {
      groupData.createdBy = ownerId;
    }

    const group = await Group.create(groupData);

    res.status(201).json({
      message: 'Group created',
      group: {
        _id: group._id,
        name: group.name,
        ownerId: group.createdBy ?? null,
        createdAt: group.createdAt
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
 * "/groups/user/{userId}": {
 * "get": {
 * "summary": "Lister les groupes d'un utilisateur",
 * "tags": ["Groups"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "userId",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e76888f7bb279fd390e18"
 * },
 * "description": "ID de l'utilisateur"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Liste des groupes rejoints par l'utilisateur",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string" },
 * "name": { "type": "string" }
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
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Convert string to ObjectId for proper querying
    const userObjId = toObjectId(userId);
    if (!userObjId) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // 1. On récupère toutes les liaisons UserGroup pour cet utilisateur
    const userGroups = await UserGroup.find({ userId: userObjId }).populate('groupId', 'name');

    // 2. On extrait la liste des groupes
    const groups = userGroups
      .filter(ug => ug.groupId) // au cas où un groupe aurait été supprimé
      .map(ug => ({
        _id: ug.groupId._id,
        name: ug.groupId.name
      }));

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/groups/{groupId}/members": {
 * "get": {
 * "summary": "Détails d'un groupe et ses membres",
 * "tags": ["Groups"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "groupId",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e42d15d4ecaf8cf4a1f6d"
 * },
 * "description": "ID du groupe"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Détails du groupe et liste des membres",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "groupId": { "type": "string" },
 * "groupName": { "type": "string" },
 * "members": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/GroupMember" }
 * }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Groupe introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;

    // 1. Vérifier que le groupe existe
    const group = await Group.findById(groupId).select('name');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 2. Récupérer les liaisons UserGroup pour ce groupe
    const userGroups = await UserGroup.find({ groupId }).populate(
      'userId',
      'username profilePicture'
    );

    // 3. Construire la liste des membres
    const members = userGroups
      .filter(ug => ug.userId)
      .map(ug => ({
        _id: ug.userId._id,
        username: ug.userId.username,
        profilePicture: ug.userId.profilePicture
      }));

    res.json({
      groupId: group._id,
      groupName: group.name,
      members
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/groups/{groupId}": {
 * "put": {
 * "summary": "Modifier le nom d'un groupe",
 * "tags": ["Groups"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "groupId",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e42d15d4ecaf8cf4a1f6d"
 * }
 * }
 * ],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "required": ["name"],
 * "properties": {
 * "name": { "type": "string", "example": "Nouveau nom" }
 * }
 * }
 * }
 * }
 * },
 * "responses": {
 * "200": {
 * "description": "Groupe mis à jour",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "group": { "$ref": "#/components/schemas/Group" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Groupe introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "delete": {
 * "summary": "Supprimer un groupe",
 * "tags": ["Groups"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "groupId",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e41d6f42f536195f29c9e"
 * }
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Groupe supprimé",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "groupId": { "type": "string" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Groupe introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.put('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;

    const group = await Group.findByIdAndUpdate(
      groupId,
      { name },
      { new: true, runValidators: true }
    );

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({
      message: 'Group updated',
      group: {
        _id: group._id,
        name: group.name
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findByIdAndDelete(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Supprimer aussi les liens UserGroup associés
    await UserGroup.deleteMany({ groupId });

    res.json({
      message: 'Group deleted',
      groupId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/groups/{groupId}/members/{userId}": {
 * "delete": {
 * "summary": "Retirer un utilisateur d'un groupe",
 * "tags": ["Groups"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "groupId",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "69623940bee8d98d13b55864"
 * },
 * "description": "ID du groupe"
 * },
 * {
 * "in": "path",
 * "name": "userId",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e76888f7bb279fd390e18"
 * },
 * "description": "ID de l'utilisateur à retirer"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Utilisateur retiré du groupe",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "groupId": { "type": "string" },
 * "userId": { "type": "string" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Utilisateur ou groupe introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.delete('/:groupId/members/:userId', async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const deletedLink = await UserGroup.findOneAndDelete({ groupId, userId });

    if (!deletedLink) {
      return res
        .status(404)
        .json({ error: 'User is not a member of this group or relation not found' });
    }

    res.json({
      message: 'User removed from group',
      groupId,
      userId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/groups/{id}": {
 * "get": {
 * "summary": "Récupérer un groupe par son ID",
 * "tags": ["Groups"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": {
 * "type": "string",
 * "example": "695e41d6f42f536195f29c9c"
 * }
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Détails du groupe",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/Group" }
 * }
 * }
 * },
 * "404": { "description": "Groupe introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('createdBy', 'username email');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
