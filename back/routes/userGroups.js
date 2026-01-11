import express from 'express';
import mongoose from 'mongoose';
import { UserGroup, User, Group } from '../models/index.js';

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
// DÉFINITION DES SCHÉMAS SWAGGER (COMPONENTS)
// ==========================================

/**
 * @swagger
 * {
 * "components": {
 * "schemas": {
 * "UserGroup": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string", "description": "ID unique de la relation" },
 * "userId": { "type": "string", "description": "ID de l'utilisateur" },
 * "groupId": { "type": "string", "description": "ID du groupe" },
 * "status": { "type": "string", "enum": ["pending", "member", "admin"], "description": "Statut dans le groupe" },
 * "createdAt": { "type": "string", "format": "date-time" },
 * "updatedAt": { "type": "string", "format": "date-time" }
 * }
 * },
 * "UserGroupInput": {
 * "type": "object",
 * "required": ["userId", "groupId"],
 * "properties": {
 * "userId": { "type": "string", "example": "695e75de8f7bb279fd390dde" },
 * "groupId": { "type": "string", "example": "695e41d6f42f536195f29c9e" },
 * "status": { "type": "string", "enum": ["pending", "member", "admin"], "default": "member" }
 * }
 * },
 * "GroupMemberResponse": {
 * "type": "object",
 * "properties": {
 * "groupId": { "type": "string" },
 * "groupName": { "type": "string" },
 * "members": {
 * "type": "array",
 * "items": {
 * "type": "object",
 * "properties": {
 * "userId": { "type": "string" },
 * "username": { "type": "string" },
 * "status": { "type": "string" }
 * }
 * }
 * }
 * }
 * },
 * "PendingInviteResponse": {
 * "type": "object",
 * "properties": {
 * "id": { "type": "string", "description": "ID de l'invitation (UserGroup ID)" },
 * "name": { "type": "string", "description": "Nom du groupe" },
 * "groupId": { "type": "string" },
 * "type": { "type": "string", "example": "invite" },
 * "category": { "type": "string", "example": "group" }
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
 * "/user-groups": {
 * "get": {
 * "summary": "Lister toutes les relations utilisateurs-groupes",
 * "description": "Route brute pour debug/admin.",
 * "tags": ["UserGroups"],
 * "responses": {
 * "200": {
 * "description": "Liste complète récupérée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/UserGroup" }
 * }
 * }
 * }
 * },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "post": {
 * "summary": "Créer une relation (Ajouter un utilisateur à un groupe)",
 * "tags": ["UserGroups"],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/UserGroupInput" }
 * }
 * }
 * },
 * "responses": {
 * "201": {
 * "description": "Relation créée",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/UserGroup" }
 * }
 * }
 * },
 * "400": { "description": "Erreur de validation" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/', async (req, res) => {
  try {
    const userGroups = await UserGroup.find()
      .populate('userId', 'username email')
      .populate('groupId', 'name description');
    res.json(userGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/user-groups/members/{groupId}": {
 * "get": {
 * "summary": "Lister les membres d'un groupe",
 * "tags": ["UserGroups"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "groupId",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29c9e" },
 * "description": "ID du groupe"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Détails du groupe et liste des membres",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/GroupMemberResponse" }
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
router.get('/members/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    // 1. Chercher toutes les relations UserGroup pour ce groupe
    const userGroups = await UserGroup.find({ groupId })
      .populate('userId', 'username email')
      .populate('groupId', 'name');

    // 2. Si aucun UserGroup mais que le groupe existe quand même
    let group = null;

    if (userGroups.length > 0) {
      group = userGroups[0].groupId; // déjà peuplé
    } else {
      group = await Group.findById(groupId).select('name');
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
    }

    // 3. Construire la liste des membres avec leur statut
    const members = userGroups.map(ug => ({
      userId: ug.userId._id,
      username: ug.userId.username,
      status: ug.status // ex: admin, member, pending...
    }));

    // 4. Réponse structurée
    res.json({
      groupId: groupId,
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
 * "/user-groups/pending/{userId}": {
 * "get": {
 * "summary": "Lister les invitations en attente pour un utilisateur",
 * "tags": ["UserGroups"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "userId",
 * "required": true,
 * "schema": { "type": "string", "example": "695e75de8f7bb279fd390dde" },
 * "description": "ID de l'utilisateur"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Liste des invitations",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/PendingInviteResponse" }
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
router.get('/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Convert string to ObjectId for proper querying
    const userObjId = toObjectId(userId);
    if (!userObjId) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const pendingInvites = await UserGroup.find({
      userId: userObjId,
      status: 'pending'
    }).populate('groupId', 'name');

    const result = pendingInvites
      .filter(ug => ug.groupId)
      .map(ug => ({
        id: ug._id,
        name: ug.groupId.name,
        groupId: ug.groupId._id,
        type: 'invite',
        category: 'group'
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
 * "/user-groups/{id}/accept": {
 * "post": {
 * "summary": "Accepter une invitation de groupe",
 * "tags": ["UserGroups"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d7f42f536195f29ce2" },
 * "description": "ID de l'invitation (UserGroup ID)"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Invitation acceptée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "userGroup": { "$ref": "#/components/schemas/UserGroup" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Invitation introuvable" },
 * "400": { "description": "Erreur de validation" }
 * }
 * }
 * }
 * }
 * }
 */
router.post('/:id/accept', async (req, res) => {
  try {
    const userGroup = await UserGroup.findByIdAndUpdate(
      req.params.id,
      { status: 'member' },
      { new: true }
    ).populate('groupId', 'name');

    if (!userGroup) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    res.json({
      message: 'Group invitation accepted',
      userGroup
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/user-groups/{id}/decline": {
 * "post": {
 * "summary": "Refuser (supprimer) une invitation de groupe",
 * "tags": ["UserGroups"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d7f42f536195f29ce2" },
 * "description": "ID de l'invitation (UserGroup ID)"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Invitation refusée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Invitation introuvable" },
 * "400": { "description": "Erreur" }
 * }
 * }
 * }
 * }
 * }
 */
router.post('/:id/decline', async (req, res) => {
  try {
    const userGroup = await UserGroup.findByIdAndDelete(req.params.id);

    if (!userGroup) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    res.json({
      message: 'Group invitation declined'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/user-groups/{id}": {
 * "get": {
 * "summary": "Récupérer une relation par ID",
 * "tags": ["UserGroups"],
 * "parameters": [
 * { "in": "path", "name": "id", "required": true, "schema": { "type": "string", "example": "695e41d7f42f536195f29ce2" } }
 * ],
 * "responses": {
 * "200": {
 * "description": "Détails de la relation",
 * "content": { "application/json": { "schema": { "$ref": "#/components/schemas/UserGroup" } } }
 * },
 * "404": { "description": "Relation introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "put": {
 * "summary": "Mettre à jour une relation (ex: changer le statut)",
 * "tags": ["UserGroups"],
 * "parameters": [
 * { "in": "path", "name": "id", "required": true, "schema": { "type": "string", "example": "695e41d7f42f536195f29ce2" } }
 * ],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": { "type": "object", "description": "Champs à mettre à jour" }
 * }
 * }
 * },
 * "responses": {
 * "200": {
 * "description": "Relation mise à jour",
 * "content": { "application/json": { "schema": { "$ref": "#/components/schemas/UserGroup" } } }
 * },
 * "404": { "description": "Relation introuvable" },
 * "400": { "description": "Erreur de validation" }
 * }
 * },
 * "delete": {
 * "summary": "Supprimer une relation",
 * "tags": ["UserGroups"],
 * "parameters": [
 * { "in": "path", "name": "id", "required": true, "schema": { "type": "string", "example": "695e41d7f42f536195f29ce2" } }
 * ],
 * "responses": {
 * "200": {
 * "description": "Relation supprimée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Relation introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/:id', async (req, res) => {
  try {
    const userGroup = await UserGroup.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('groupId', 'name description');
    if (!userGroup) {
      return res.status(404).json({ error: 'UserGroup not found' });
    }
    res.json(userGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const userGroup = await UserGroup.create(req.body);
    res.status(201).json(userGroup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const userGroup = await UserGroup.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!userGroup) {
      return res.status(404).json({ error: 'UserGroup not found' });
    }
    res.json(userGroup);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userGroup = await UserGroup.findByIdAndDelete(req.params.id);
    if (!userGroup) {
      return res.status(404).json({ error: 'UserGroup not found' });
    }
    res.json({ message: 'UserGroup deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
