import express from 'express';
import { Step } from '../models/index.js';
import { upload, uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '../config/cloudinary.js';

const router = express.Router();

/**
 * 1. List Steps (tous les steps d’un journey)
 * GET /api/steps/journey/:journeyId
 *
 * Objectif : retourner tous les steps associés à une journey donnée,
 * éventuellement triés par "order".
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
 * (Optionnel) GET all steps (pour admin/debug)
 * GET /api/steps
 */
router.get('/', async (req, res) => {
  try {
    const steps = await Step.find();
    res.json(steps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Get Step (détail d’un step)
 * GET /api/steps/:id
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

/**
 * 3. Create Step
 * POST /api/steps
 *
 * Body JSON :
 * {
 *   "journeyId": "...",
 *   "riddle": "Find the hidden statue",
 *   "latitude": 46.123456,
 *   "longitude": 6.123456
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { journeyId, riddle, latitude, longitude, image, note, accuracy, altitude, speed } = req.body;

    if (!journeyId) {
      return res
        .status(400)
        .json({ error: 'journeyId is required' });
    }

    // Build location GeoJSON from lat/lng if provided
    const location = (latitude != null && longitude != null) ? {
      type: 'Point',
      coordinates: [longitude, latitude]
    } : { type: 'Point', coordinates: [0, 0] };

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
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 4. Update Step
 * PUT /api/steps/:id
 */
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

/**
 * 5. Delete Step
 * DELETE /api/steps/:id
 */
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
 * 6. Upload Step Image
 * POST /steps/:id/upload-image
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
      image: result.url,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 7. Delete Step Image
 * DELETE /api/steps/:id/image
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
