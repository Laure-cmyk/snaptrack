import express from 'express';
import { Step } from '../models/index.js';
import {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl
} from '../config/cloudinary.js';

const router = express.Router();

// ==========================================
// DÉFINITION DES SCHÉMAS SWAGGER (COMPONENTS)
// ==========================================

/**
 * @swagger
 * {
 * "components": {
 * "schemas": {
 * "Step": {
 * "type": "object",
 * "properties": {
 * "id": { "type": "string", "description": "ID unique de l'étape" },
 * "journeyId": { "type": "string", "description": "ID du parcours associé" },
 * "riddle": { "type": "string", "description": "Énigme (utilisé à la création)" },
 * "title": { "type": "string", "description": "Titre (utilisé à la lecture/update)" },
 * "description": { "type": "string", "description": "Description (utilisé à la lecture/update)" },
 * "image": { "type": "string", "description": "URL de l'image" },
 * "latitude": { "type": "number" },
 * "longitude": { "type": "number" },
 * "accuracy": { "type": "number" },
 * "altitude": { "type": "number" },
 * "speed": { "type": "number" },
 * "order": { "type": "integer" }
 * }
 * },
 * "StepInput": {
 * "type": "object",
 * "required": ["journeyId"],
 * "properties": {
 * "journeyId": { "type": "string", "example": "695e41d5f42f536195f29c8f" },
 * "riddle": { "type": "string", "example": "Trouvez la statue cachée" },
 * "latitude": { "type": "number", "example": 46.123 },
 * "longitude": { "type": "number", "example": 6.123 },
 * "accuracy": { "type": "number" },
 * "altitude": { "type": "number" },
 * "speed": { "type": "number" },
 * "note": { "type": "string" },
 * "image": { "type": "string", "description": "URL directe (si pas d'upload)" }
 * }
 * },
 * "StepUpdateInput": {
 * "type": "object",
 * "properties": {
 * "title": { "type": "string" },
 * "description": { "type": "string" },
 * "order": { "type": "integer" },
 * "journeyId": { "type": "string", "example": "695e41d5f42f536195f29c8f" }
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
 * "/steps/journey/{journeyId}": {
 * "get": {
 * "summary": "Lister les étapes d'un parcours",
 * "tags": ["Steps"],
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
 * "description": "Liste des étapes récupérée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/Step" }
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

    const steps = await Step.find({ journeyId }).sort({ timestamp: 1 });

    const result = steps.map(s => ({
      id: s._id,
      journeyId: s.journeyId,
      riddle: s.riddle,
      image: s.image,
      latitude: s.latitude,
      longitude: s.longitude,
      accuracy: s.accuracy,
      altitude: s.altitude,
      speed: s.speed
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
 * "/steps": {
 * "get": {
 * "summary": "Lister toutes les étapes (Admin/Debug)",
 * "tags": ["Steps"],
 * "responses": {
 * "200": {
 * "description": "Liste complète des étapes",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "array",
 * "items": { "$ref": "#/components/schemas/Step" }
 * }
 * }
 * }
 * },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "post": {
 * "summary": "Créer une nouvelle étape",
 * "tags": ["Steps"],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/StepInput" }
 * }
 * }
 * },
 * "responses": {
 * "201": {
 * "description": "Étape créée avec succès",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "step": { "$ref": "#/components/schemas/Step" }
 * }
 * }
 * }
 * }
 * },
 * "400": { "description": "journeyId manquant ou erreur de validation" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/', async (req, res) => {
  try {
    const steps = await Step.find();
    res.json(steps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { journeyId, riddle, latitude, longitude, image, note, accuracy, altitude, speed } =
      req.body;

    if (!journeyId) {
      return res.status(400).json({ error: 'journeyId is required' });
    }

    // Build location GeoJSON from lat/lng if provided
    const location =
      latitude != null && longitude != null
        ? {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        : { type: 'Point', coordinates: [0, 0] };

    const step = await Step.create({
      journeyId,
      riddle,
      location,
      latitude,
      longitude,
      image,
      note,
      accuracy,
      altitude,
      speed
    });

    res.status(201).json({
      message: 'Step created',
      step: {
        id: step._id,
        journeyId: step.journeyId,
        riddle: step.riddle,
        latitude: step.latitude,
        longitude: step.longitude,
        accuracy: step.accuracy,
        altitude: step.altitude,
        speed: step.speed
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
 * "/steps/{id}": {
 * "get": {
 * "summary": "Récupérer une étape par ID",
 * "tags": ["Steps"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cbb" }
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Détails de l'étape",
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/Step" }
 * }
 * }
 * },
 * "404": { "description": "Étape introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * },
 * "put": {
 * "summary": "Mettre à jour une étape",
 * "tags": ["Steps"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cbb" }
 * }
 * ],
 * "requestBody": {
 * "required": true,
 * "content": {
 * "application/json": {
 * "schema": { "$ref": "#/components/schemas/StepUpdateInput" }
 * }
 * }
 * },
 * "responses": {
 * "200": {
 * "description": "Étape mise à jour",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "step": { "$ref": "#/components/schemas/Step" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Étape introuvable" },
 * "400": { "description": "Données invalides" }
 * }
 * },
 * "delete": {
 * "summary": "Supprimer une étape",
 * "tags": ["Steps"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cbb" }
 * }
 * ],
 * "responses": {
 * "200": {
 * "description": "Étape supprimée",
 * "content": {
 * "application/json": {
 * "schema": {
 * "type": "object",
 * "properties": {
 * "message": { "type": "string" },
 * "id": { "type": "string" }
 * }
 * }
 * }
 * }
 * },
 * "404": { "description": "Étape introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.get('/:id', async (req, res) => {
  try {
    const step = await Step.findById(req.params.id);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    res.json({
      id: step._id,
      journeyId: step.journeyId,
      title: step.title,
      description: step.description,
      order: step.order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, description, order, journeyId } = req.body;

    const step = await Step.findByIdAndUpdate(
      req.params.id,
      { title, description, order, journeyId },
      { new: true, runValidators: true }
    );

    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    res.json({
      message: 'Step updated',
      step: {
        id: step._id,
        journeyId: step.journeyId,
        title: step.title,
        description: step.description,
        order: step.order
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const step = await Step.findByIdAndDelete(req.params.id);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }
    // Delete image from Cloudinary if exists
    if (step.image) {
      const publicId = getPublicIdFromUrl(step.image);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }
    res.json({
      message: 'Step deleted',
      id: step._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * {
 * "paths": {
 * "/steps/{id}/upload-image": {
 * "post": {
 * "summary": "Uploader une image pour une étape",
 * "tags": ["Steps"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cbb" }
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
 * "404": { "description": "Étape introuvable" },
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

    const step = await Step.findById(req.params.id);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // Delete old image from Cloudinary if exists
    if (step.image) {
      const oldPublicId = getPublicIdFromUrl(step.image);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }

    // Upload new image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'steps');

    // Update step with new image URL
    step.image = result.url;
    await step.save();

    res.json({
      message: 'Step image uploaded successfully',
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
 * "/steps/{id}/image": {
 * "delete": {
 * "summary": "Supprimer l'image d'une étape",
 * "tags": ["Steps"],
 * "parameters": [
 * {
 * "in": "path",
 * "name": "id",
 * "required": true,
 * "schema": { "type": "string", "example": "695e41d6f42f536195f29cbb" }
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
 * "404": { "description": "Étape introuvable" },
 * "500": { "description": "Erreur serveur" }
 * }
 * }
 * }
 * }
 * }
 */
router.delete('/:id/image', async (req, res) => {
  try {
    const step = await Step.findById(req.params.id);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    if (step.image) {
      const publicId = getPublicIdFromUrl(step.image);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    step.image = null;
    await step.save();

    res.json({ message: 'Step image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
