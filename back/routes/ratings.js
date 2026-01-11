import express from 'express';
import mongoose from 'mongoose'; // Nécessaire pour valider les ObjectIds
import { Rating } from '../models/index.js';

const router = express.Router();

// ==========================================
// DÉFINITION DES SCHÉMAS SWAGGER (COMPONENTS)
// ==========================================

/**
 * @swagger
 * {
 * "components": {
 * "schemas": {
 * "Rating": {
 * "type": "object",
 * "properties": {
 * "id": { "type": "string", "description": "ID unique du vote" },
 * "userId": { "type": "string", "description": "ID de l'utilisateur" },
 * "username": { "type": "string", "description": "Nom de l'utilisateur (si peuplé)" },
 * "journeyId": { "type": "string", "description": "ID du parcours" },
 * "rating": { "type": "number", "description": "La note donnée" },
 * "createdAt": { "type": "string", "format": "date-time" }
 * }
 * },
 * "RatingInput": {
 * "type": "object",
 * "required": ["userId", "journeyId", "value"],
 * "properties": {
 * "userId": { "type": "string", "example": "60d5ecb8b4..." },
 * "journeyId": { "type": "string", "example": "60d5ecb9c5..." },
 * "value": { "type": "number", "description": "Valeur de la note (ex: 1 à 5)", "example": 4 }
 * }
 * },
 * "AverageRatingResponse": {
 * "type": "object",
 * "properties": {
 * "journeyId": { "type": "string" },
 * "averageRating": { "type": "number", "example": 4.5 },
 * "count": { "type": "integer", "example": 12 }
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
 * "/ratings": {
 * "post": {
 * "summary": "Créer ou mettre à jour une note (Upsert)",
 * "description": "Si l'utilisateur a déjà noté ce parcours, la note est mise à jour. Sinon, elle est créée.",
 * "tags": ["Ratings"],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/RatingInput" }
 * }
 * }
 * },
 * "responses": {
 * "201": {
 * "description": "Note enregistrée avec succès",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "rating": {
 * "type": "object",
 * "properties": {
 * "id": { "type": "string" },
 * "value": { "type": "number" }
 * }
 * }
 * }
 * }
 * }
 * }
 * },
 * "400": { "description": "Données manquantes, format d'ID invalide ou valeur non numérique" },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "get": {
 * "summary": "Lister les notes",
 * "description": "Récupère les notes, filtrables par parcours ou utilisateur.",
 * "tags": ["Ratings"],
 * "parameters": [
 * {
 * "in": "query",
 * "name": "journeyId",
 * "schema": { "type": "string", "example": "695e41d5f42f536195f29c7e" },
 * "description": "Filtrer par ID de parcours"
 * },
 * {
 * "in": "query",
 * "name": "userId",
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cb0" },
 * "description": "Filtrer par ID d'utilisateur"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Liste des notes récupérée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/Rating" }
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

router.post('/', async (req, res) => {
  try {
    // 1. Récupération des données (on accepte 'value' car c'est ce que Postman envoie)
    let { userId, journeyId, value } = req.body;

    // 2. Nettoyage des espaces vides (Trim)
    if (userId) userId = userId.trim();
    if (journeyId) journeyId = journeyId.trim();

    // 3. Vérifications
    if (!userId || !journeyId || typeof value !== 'number') {
      return res.status(400).json({
        error: 'userId, journeyId et value (nombre) sont requis'
      });
    }

    // Vérification que les IDs sont au bon format MongoDB
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(journeyId)) {
      return res.status(400).json({ error: 'Format de userId ou journeyId invalide' });
    }

    // 4. Upsert : Met à jour si existe, sinon crée
    const rating = await Rating.findOneAndUpdate(
      { userId, journeyId }, // Critère de recherche
      { rating: value }, // Mise à jour (on enregistre 'value' dans le champ 'rating')
      { upsert: true, new: true, runValidators: true } // Options
    );

    res.status(201).json({
      message: 'Rating saved',
      rating: {
        id: rating._id,
        userId: rating.userId,
        journeyId: rating.journeyId,
        value: rating.rating, // On renvoie la valeur stockée
        createdAt: rating.createdAt
      }
    });
  } catch (error) {
    console.error(error); // Affiche l'erreur dans le terminal pour le débogage
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { journeyId, userId } = req.query;
    const filter = {};

    if (journeyId) filter.journeyId = journeyId;
    if (userId) filter.userId = userId;

    const ratings = await Rating.find(filter)
      .populate('userId', 'username')
      .sort({ createdAt: -1 });

    const result = ratings.map(r => ({
      id: r._id,
      userId: r.userId?._id ?? r.userId,
      username: r.userId?.username ?? null,
      rating: r.rating,
      createdAt: r.createdAt
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
 * "/ratings/average/{journeyId}": {
 * "get": {
 * "summary": "Obtenir la moyenne des notes d'un parcours",
 * "tags": ["Ratings"],
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
 * "description": "Moyenne calculée avec succès",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/AverageRatingResponse" }
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
router.get('/average/:journeyId', async (req, res) => {
  try {
    const { journeyId } = req.params;

    // Vérification du format ID
    if (!mongoose.Types.ObjectId.isValid(journeyId)) {
      return res.status(400).json({ error: 'Invalid journeyId format' });
    }

    const result = await Rating.aggregate([
      { $match: { journeyId: new mongoose.Types.ObjectId(journeyId) } },
      { $group: { _id: '$journeyId', averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (result.length === 0) {
      return res.json({ journeyId, averageRating: 0, count: 0 });
    }

    res.json({
      journeyId,
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      count: result[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
