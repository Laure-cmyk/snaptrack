import express from 'express';
import { UserJourney } from '../models/index.js';

const router = express.Router();

// ==========================================
// DÉFINITION DES SCHÉMAS SWAGGER (COMPONENTS)
// ==========================================

/**
 * @swagger
 * {
 * "components": {
 * "schemas": {
 * "UserJourney": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string", "description": "ID unique de la relation" },
 * "userId": { "type": "string", "description": "ID de l'utilisateur" },
 * "journeyId": { "type": "string", "description": "ID du parcours" },
 * "status": { "type": "string", "description": "Statut du parcours (ex: in-progress, completed)" },
 * "createdAt": { "type": "string", "format": "date-time" },
 * "updatedAt": { "type": "string", "format": "date-time" }
 * }
 * },
 * "UserJourneyInput": {
 * "type": "object",
 * "required": ["userId", "journeyId"],
 * "properties": {
 * "userId": { "type": "string", "example": "695e75de8f7bb279fd390dde" },
 * "journeyId": { "type": "string", "example": "695e41d5f42f536195f29c8f" },
 * "status": { "type": "string", "example": "in-progress" }
 * }
 * },
 * "UserJourneyAggregated": {
 * "type": "object",
 * "properties": {
 * "journeyId": { "type": "string" },
 * "journeyName": { "type": "string" },
 * "users": {
 * "type": "array",
 * "items": {
 * "type": "object",
 * "properties": {
 * "userId": { "type": "string" },
 * "username": { "type": "string" }
 * }
 * }
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
 * "/user-journeys": {
 * "get": {
 * "summary": "Lister les parcours utilisateurs (Agrégé par parcours)",
 * "description": "Renvoie une liste regroupée par parcours, montrant tous les utilisateurs associés à chaque parcours.",
 * "tags": ["UserJourneys"],
 * "responses": {
 * "200": {
 * "description": "Liste agrégée récupérée avec succès",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/UserJourneyAggregated" }
 * }
 * }
 * }
 * },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "post": {
 * "summary": "Créer une relation User-Journey",
 * "tags": ["UserJourneys"],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/UserJourneyInput" }
 * }
 * }
 * },
 * "responses": {
 * "201": {
 * "description": "Relation créée",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/UserJourney" }
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
    const { userId, status } = req.query;

    const filter = {};

    // Filtrer par userId (optionnel)
    if (userId) {
      filter.userId = userId;
    }

    // Filtrer par status (optionnel, si tu as un champ status dans UserJourney)
    if (status) {
      filter.status = status;
    }

    // On récupère toutes les liaisons UserJourney qui matchent le filtre
    const userJourneys = await UserJourney.find(filter)
      .populate('userId', 'username')
      .populate('journeyId', 'name title code createdAt');

    // On regroupe par journeyId
    const journeyMap = new Map();

    userJourneys.forEach(uj => {
      if (!uj.journeyId || !uj.userId) return;

      const jId = uj.journeyId._id.toString();

      if (!journeyMap.has(jId)) {
        journeyMap.set(jId, {
          journeyId: uj.journeyId._id,
          journeyName: uj.journeyId.name || uj.journeyId.title || '',
          users: []
        });
      }

      const group = journeyMap.get(jId);

      group.users.push({
        userId: uj.userId._id,
        username: uj.userId.username
      });
    });

    const result = Array.from(journeyMap.values());

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/user-journeys/{id}": {
 * "get": {
 * "summary": "Récupérer une relation par ID",
 * "tags": ["UserJourneys"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d7f42f536195f29ce2" },
 * "description": "ID de la relation UserJourney"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Détails de la relation",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/UserJourney" }
 * }
 * }
 * },
 * "404": { "description": "Relation introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "put": {
 * "summary": "Mettre à jour une relation (ex: changer le statut)",
 * "tags": ["UserJourneys"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d7f42f536195f29ce2" }
 * }
 * ],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "description": "Champs à mettre à jour (partiel)",
 * "example": {
 * "status": "completed"
 * }
 * }
 * }
 * }
 * },
 * "responses": {
 * "200": {
 * "description": "Relation mise à jour",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/UserJourney" }
 * }
 * }
 * },
 * "404": { "description": "Relation introuvable" },
 * "400": { "description": "Erreur de validation" }
 * }
 * },
 * "delete": {
 * "summary": "Supprimer une relation",
 * "tags": ["UserJourneys"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d7f42f536195f29cce" }
 * }
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
    const userJourney = await UserJourney.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('journeyId', 'title description');

    if (!userJourney) {
      return res.status(404).json({ error: 'UserJourney not found' });
    }

    res.json(userJourney);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const userJourney = await UserJourney.create(req.body);
    res.status(201).json(userJourney);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const userJourney = await UserJourney.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!userJourney) {
      return res.status(404).json({ error: 'UserJourney not found' });
    }
    res.json(userJourney);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userJourney = await UserJourney.findByIdAndDelete(req.params.id);
    if (!userJourney) {
      return res.status(404).json({ error: 'UserJourney not found' });
    }
    res.json({ message: 'UserJourney deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
