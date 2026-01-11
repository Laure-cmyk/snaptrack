import express from 'express';
import { Journey, Step, Rating } from '../models/index.js';
import {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl
} from '../config/cloudinary.js';

const router = express.Router();

// ==========================================
// DÉFINITION DES SCHÉMAS (COMPONENTS)
// ==========================================

/**
 * @swagger
 * {
 * "components": {
 * "schemas": {
 * "Journey": {
 * "type": "object",
 * "properties": {
 * "_id": { "type": "string", "description": "ID unique du parcours" },
 * "name": { "type": "string", "description": "Nom du parcours" },
 * "description": { "type": "string" },
 * "time": { "type": "number", "description": "Durée estimée en minutes" },
 * "town": { "type": "string" },
 * "image": { "type": "string", "description": "URL de l'image de couverture" },
 * "averageRating": { "type": "number", "description": "Note moyenne calculée" },
 * "createdAt": { "type": "string", "format": "date-time" },
 * "updatedAt": { "type": "string", "format": "date-time" }
 * }
 * },
 * "JourneyInput": {
 * "type": "object",
 * "required": ["name", "description", "time", "town"],
 * "properties": {
 * "name": { "type": "string", "example": "Balade en forêt" },
 * "description": { "type": "string", "example": "Une belle promenade..." },
 * "time": { "type": "number", "example": 120 },
 * "town": { "type": "string", "example": "Lausanne" }
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
 * "schema": { "type": "string", "example": "695e41d5f42f536195f29c8f" },
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
 * "schema": { "type": "string", "example": "695e75de8f7bb279fd390dde" },
 * "description": "ID de l'utilisateur à retirer"
 * },
 * {
 * "in": "query",
 * "name": "journeyId",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cb2" },
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
    const { search, limit = 50, offset = 0, sort } = req.query;

    const filter = {};

    // Filtre par nom (search)
    if (search) {
      filter.name = { $regex: search, $options: 'i' }; // insensitive
    }

    // Tri
    let sortQuery = {};
    if (sort === 'alphabetical') sortQuery = { name: 1 };
    else if (sort === 'recent') sortQuery = { createdAt: -1 };
    else sortQuery = {}; // default no sort

    // Query principale
    const journeys = await Journey.find(filter)
      .select('name image time description town')
      .limit(Number(limit))
      .skip(Number(offset))
      .sort(sortQuery)
      .lean();

    // Fetch average ratings for all journeys
    const journeyIds = journeys.map(j => j._id);
    const ratingsAgg = await Rating.aggregate([
      { $match: { journeyId: { $in: journeyIds } } },
      { $group: { _id: '$journeyId', averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    // Map ratings to journeys
    const ratingsMap = {};
    ratingsAgg.forEach(r => {
      ratingsMap[r._id.toString()] = Math.round(r.averageRating * 10) / 10;
    });

    // Add averageRating to each journey
    const journeysWithRatings = journeys.map(j => ({
      ...j,
      averageRating: ratingsMap[j._id.toString()] || 0
    }));

    // Total pour pagination
    const total = await Journey.countDocuments(filter);

    res.json({
      message: 'Journeys fetched',
      total,
      journeys: journeysWithRatings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const journey = await Journey.create(req.body);
    res.status(201).json(journey);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/journeys/{id}": {
 * "get": {
 * "summary": "Récupérer un parcours par son ID",
 * "tags": ["Journeys"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cb1" },
 * "description": "ID du parcours"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Détails du parcours",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/Journey" }
 * }
 * }
 * },
 * "404": { "description": "Parcours introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "put": {
 * "summary": "Mettre à jour un parcours",
 * "tags": ["Journeys"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cb1" }
 * }
 * ],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/JourneyInput" }
 * }
 * }
 * },
 * "responses": {
 * "200": {
 * "description": "Parcours mis à jour",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/Journey" }
 * }
 * }
 * },
 * "404": { "description": "Parcours introuvable" },
 * "400": { "description": "Données invalides" }
 * }
 * },
 * "delete": {
 * "summary": "Supprimer un parcours",
 * "tags": ["Journeys"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cb2" }
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Parcours supprimé",
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
 * "404": { "description": "Parcours introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/:id', async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    res.json(journey);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const journey = await Journey.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    res.json(journey);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const journey = await Journey.findByIdAndDelete(req.params.id);
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    // Delete image from Cloudinary if exists
    if (journey.image) {
      const publicId = getPublicIdFromUrl(journey.image);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }
    res.json({ message: 'Journey deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/journeys/{id}/upload-image": {
 * "post": {
 * "summary": "Uploader une image pour un parcours",
 * "tags": ["Journeys"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e762e8f7bb279fd390dec" },
 * "description": "ID du parcours"
 * }
 * ],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "multipart/form-data": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "image": {
 * "type": "string",
 * "format": "binary",
 * "description": "Fichier image à uploader"
 * }
 * }
 * }
 * }
 * }
 * },
 * "responses": {
 * "200": {
 * "description": "Image uploadée avec succès",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "image": { "type": "string", "description": "URL de l'image" }
 * }
 * }
 * }
 * }
 * },
 * "400": { "description": "Aucun fichier fourni" },
 * "404": { "description": "Parcours introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.post('/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const journey = await Journey.findById(req.params.id);
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    // Delete old image from Cloudinary if exists
    if (journey.image) {
      const oldPublicId = getPublicIdFromUrl(journey.image);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }

    // Upload new image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'journeys');

    // Update journey with new image URL
    journey.image = result.url;
    await journey.save();

    res.json({
      message: 'Journey image uploaded successfully',
      image: result.url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/journeys/{id}/image": {
 * "delete": {
 * "summary": "Supprimer l'image d'un parcours",
 * "tags": ["Journeys"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cb0" }
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Image supprimée",
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
 * "404": { "description": "Parcours introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.delete('/:id/image', async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id);
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    if (journey.image) {
      const publicId = getPublicIdFromUrl(journey.image);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    journey.image = null;
    await journey.save();

    res.json({ message: 'Journey image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/journeys/{journeyId}/steps/count": {
 * "get": {
 * "summary": "Compter les étapes d'un parcours",
 * "tags": ["Journeys"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "journeyId",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cb3" },
 * "description": "ID du parcours"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Nombre d'étapes récupéré",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "journeyId": { "type": "string" },
 * "totalSteps": { "type": "integer" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Parcours introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/:journeyId/steps/count', async (req, res) => {
  try {
    const { journeyId } = req.params;

    // Vérifier si la journey existe
    const journey = await Journey.findById(journeyId);
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    // Compter les steps
    const totalSteps = await Step.countDocuments({ journeyId });

    res.json({
      message: 'Step amount fetched',
      journeyId,
      totalSteps
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/journeys/{journeyId}/rating": {
 * "get": {
 * "summary": "Obtenir la note moyenne d'un parcours",
 * "tags": ["Journeys"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "journeyId",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cb3" },
 * "description": "ID du parcours"
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Note moyenne calculée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "journeyId": { "type": "string" },
 * "averageRating": { "type": "number", "nullable": true },
 * "totalRatings": { "type": "integer" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Parcours introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/:journeyId/rating', async (req, res) => {
  try {
    const { journeyId } = req.params;

    // Vérifier si la journey existe
    const journey = await Journey.findById(journeyId);
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    // Récupérer tous les ratings
    const ratings = await Rating.find({ journeyId });

    if (ratings.length === 0) {
      return res.json({
        message: 'No ratings for this journey',
        journeyId,
        averageRating: null,
        totalRatings: 0
      });
    }

    // Calculer la moyenne
    const totalRatings = ratings.length;
    const averageRating = ratings.reduce((acc, r) => acc + r.rating, 0) / totalRatings;

    res.json({
      message: 'Journey rating fetched',
      journeyId,
      averageRating: Number(averageRating.toFixed(2)),
      totalRatings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
