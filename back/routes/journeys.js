import express from 'express';
import { Journey, Step, Rating } from '../models/index.js';
import { upload, uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../config/cloudinary.js';

const router = express.Router();

/**
 * ============================================================
 *  LIST JOURNEYS
 *  GET /api/journeys
 *  Avec filtres : search, limit, offset, sort
 * ============================================================
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
      .select('name image time description')
      .limit(Number(limit))
      .skip(Number(offset))
      .sort(sortQuery);

    // Total pour pagination
    const total = await Journey.countDocuments(filter);

    res.json({
      message: 'Journeys fetched',
      total,
      journeys,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ============================================================
 *  GET JOURNEY BY ID
 * ============================================================
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

/**
 * ============================================================
 *  CREATE JOURNEY
 * ============================================================
 */
router.post('/', async (req, res) => {
  try {
    const journey = await Journey.create(req.body);
    res.status(201).json(journey);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ============================================================
 *  UPDATE JOURNEY
 * ============================================================
 */
router.put('/:id', async (req, res) => {
  try {
    const journey = await Journey.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    res.json(journey);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * ============================================================
 *  DELETE JOURNEY
 * ============================================================
 */
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
 * ============================================================
 *  UPLOAD JOURNEY IMAGE
 *  POST /api/journeys/:id/upload-image
 * ============================================================
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
      image: result.url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ============================================================
 *  DELETE JOURNEY IMAGE
 *  DELETE /api/journeys/:id/image
 * ============================================================
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
 * ============================================================
 *  COUNT STEPS OF JOURNEY
 *  GET /api/journeys/:journeyId/steps/count
 * ============================================================
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
      totalSteps,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ============================================================
 *  GET RATING OF A JOURNEY
 *  GET /api/journeys/:journeyId/rating
 * ============================================================
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
        totalRatings: 0,
      });
    }

    // Calculer la moyenne
    const totalRatings = ratings.length;
    const averageRating =
      ratings.reduce((acc, r) => acc + r.rating, 0) / totalRatings;

    res.json({
      message: 'Journey rating fetched',
      journeyId,
      averageRating: Number(averageRating.toFixed(2)),
      totalRatings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
