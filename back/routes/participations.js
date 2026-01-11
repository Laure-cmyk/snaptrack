import express from 'express';
import { Participation, User, Journey } from '../models/index.js';

const router = express.Router();

// ==========================================
// DÉFINITION DES SCHÉMAS SWAGGER (COMPONENTS)
// ==========================================

/**
 * @swagger
 * {
 * "components": {
 * "schemas": {
 * "Participation": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string", "description": "ID unique de la participation" },
 * "userId": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string" },
 * "username": { "type": "string" },
 * "email": { "type": "string" }
 * }
 * },
 * "journeyId": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string" },
 * "title": { "type": "string" }
 * }
 * },
 * "createdAt": { "type": "string", "format": "date-time" },
 * "updatedAt": { "type": "string", "format": "date-time" }
 * }
 * },
 * "ParticipationInput": {
 * "type": "object",
 * "required": ["userId", "journeyId"],
 * "properties": {
 * "userId": { "type": "string", "description": "ID de l'utilisateur", "example": "695e41d5f42f536195f29c7e" },
 * "journeyId": { "type": "string", "description": "ID du parcours", "example": "695e41d6f42f536195f29cb0" }
 * }
 * },
 * "SimplifiedParticipant": {
 * "type": "object",
 * "properties": {
 * "userId": { "type": "string" },
 * "username": { "type": "string" },
 * "journeyId": { "type": "string" }
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
 * "/participations": {
 * "get": {
 * "summary": "Lister toutes les participations",
 * "description": "Récupère la liste globale des participations. Peut être filtrée par journeyId.",
 * "tags": ["Participations"],
 * "parameters": [
 * {
 * "in": "query",
 * "name": "journeyId",
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cb0" },
 * "description": "Filtrer par ID de parcours (optionnel)"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Liste récupérée avec succès",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/Participation" }
 * }
 * }
 * }
 * },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "post": {
 * "summary": "Ajouter un participant à un parcours",
 * "tags": ["Participations"],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/ParticipationInput" }
 * }
 * }
 * },
 * "responses": {
 * "201": {
 * "description": "Participation créée",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/Participation" }
 * }
 * }
 * },
 * "400": { "description": "Données manquantes (userId ou journeyId)" },
 * "409": { "description": "L'utilisateur participe déjà à ce parcours" },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "delete": {
 * "summary": "Retirer un participant (via Query Params)",
 * "description": "Supprime une participation en spécifiant l'utilisateur et le parcours dans l'URL.",
 * "tags": ["Participations"],
 * "parameters": [
 * {
 * "in": "query",
 * "name": "userId",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d5f42f536195f29c7e" },
 * "description": "ID de l'utilisateur à retirer"
 * },
 * {
 * "in": "query",
 * "name": "journeyId",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cb0" },
 * "description": "ID du parcours concerné"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Participant retiré avec succès",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "userId": { "type": "string" },
 * "journeyId": { "type": "string" }
 * }
 * }
 * }
 * }
 * },
 * "400": { "description": "Paramètres manquants" },
 * "404": { "description": "Participation introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
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

router.post('/', async (req, res) => {
  try {
    const { userId, journeyId } = req.body;

    if (!userId || !journeyId) {
      return res.status(400).json({ error: 'userId et journeyId sont requis' });
    }

    // (Optionnel) vérifier si la participation existe déjà
    const existing = await Participation.findOne({ userId, journeyId });
    if (existing) {
      return res.status(409).json({
        error: 'Participant already registered for this journey'
      });
    }

    const participation = await Participation.create({ userId, journeyId });

    res.status(201).json({
      message: 'Participant added',
      participation: {
        _id: participation._id,
        userId: participation.userId,
        journeyId: participation.journeyId
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const { userId, journeyId } = req.query;

    if (!userId || !journeyId) {
      return res.status(400).json({ error: 'userId et journeyId sont requis dans la query' });
    }

    const deleted = await Participation.findOneAndDelete({ userId, journeyId });

    if (!deleted) {
      return res.status(404).json({ error: 'Participation not found for this user/journey' });
    }

    res.json({
      message: 'Participant removed',
      userId,
      journeyId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/participations/journey/{journeyId}": {
 * "get": {
 * "summary": "Lister les participants d'un parcours spécifique",
 * "tags": ["Participations"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "journeyId",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d5f42f536195f29c8f" },
 * "description": "ID du parcours"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Liste simplifiée des participants",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/SimplifiedParticipant" }
 * }
 * }
 * }
 * },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/journey/:journeyId', async (req, res) => {
  try {
    const { journeyId } = req.params;

    const participations = await Participation.find({ journeyId })
      .populate('userId', 'username')
      .populate('journeyId', '_id'); // juste pour vérifier

    const result = participations.map(p => ({
      userId: p.userId._id,
      username: p.userId.username,
      journeyId: p.journeyId._id
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
 * "/participations/{id}": {
 * "get": {
 * "summary": "Récupérer une participation par ID",
 * "tags": ["Participations"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d7f42f536195f29cea" },
 * "description": "ID de la participation"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Détails de la participation",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/Participation" }
 * }
 * }
 * },
 * "404": { "description": "Participation introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "put": {
 * "summary": "Mettre à jour une participation",
 * "tags": ["Participations"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d7f42f536195f29cea" }
 * }
 * ],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "description": "Champs à mettre à jour (partiel)"
 * }
 * }
 * }
 * },
 * "responses": {
 * "200": {
 * "description": "Participation mise à jour",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/Participation" }
 * }
 * }
 * },
 * "404": { "description": "Participation introuvable" },
 * "400": { "description": "Erreur de validation" }
 * }
 * },
 * "delete": {
 * "summary": "Supprimer une participation par ID",
 * "tags": ["Participations"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d7f42f536195f29cea" }
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Participation supprimée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string", "example": "Participation deleted successfully" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Participation introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
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

router.put('/:id', async (req, res) => {
  try {
    const participation = await Participation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!participation) {
      return res.status(404).json({ error: 'Participation not found' });
    }
    res.json(participation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const participation = await Participation.findByIdAndDelete(req.params.id);
    if (!participation) {
      return res.status(404).json({ error: 'Participation not found' });
    }
    res.json({ message: 'Participation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
