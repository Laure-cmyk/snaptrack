import express from 'express';
import { Step } from '../models/index.js';
import { upload, cloudinary } from '../config/cloudinary.js';

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

    const steps = await Step.find({ journeyId }).sort({ order: 1 });

    const result = steps.map((s) => ({
      id: s._id,
      journeyId: s.journeyId,
      title: s.title,
      description: s.description,
      order: s.order,
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
      order: step.order,
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
 *   "journeyId": "701",
 *   "title": "Quiz 2",
 *   "description": "Deuxième question clé",
 *   "order": 3
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { journeyId, title, description, order } = req.body;

    if (!journeyId || !title) {
      return res
        .status(400)
        .json({ error: 'journeyId et title sont requis' });
    }

    const step = await Step.create({
      journeyId,
      title,
      description,
      order,
    });

    res.status(201).json({
      message: 'Step created',
      step: {
        id: step._id,
        journeyId: step.journeyId,
        title: step.title,
        description: step.description,
        order: step.order,
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
        order: step.order,
      },
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
      try {
        const oldPublicId = step.image.split('/').slice(-1)[0].split('.')[0];
        await cloudinary.uploader.destroy(`snaptrack/steps/${oldPublicId}`);
      } catch (deleteErr) {
        console.warn('🗑️ Warning: Failed to delete step image:', deleteErr.message);
      }
    }

    res.json({
      message: 'Step deleted',
      id: step._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. Upload Step Image
 * POST /api/steps/:id/upload-image
 */
router.post('/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    console.log('📷 ====== STEP IMAGE UPLOAD START ======');
    console.log('📷 Step ID:', req.params.id);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const step = await Step.findById(req.params.id);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    // Delete old image from Cloudinary if exists
    if (step.image) {
      try {
        const oldPublicId = step.image.split('/').slice(-1)[0].split('.')[0];
        await cloudinary.uploader.destroy(`snaptrack/steps/${oldPublicId}`);
        console.log('📷 Old image deleted');
      } catch (deleteErr) {
        console.warn('📷 Warning: Failed to delete old image:', deleteErr.message);
      }
    }

    // Upload new image to Cloudinary
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'snaptrack/steps',
      resource_type: 'image',
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
    });

    // Update step with new Cloudinary URL
    step.image = uploadResult.secure_url;
    await step.save();

    console.log('📷 ====== STEP IMAGE UPLOAD COMPLETE ======');
    
    res.json({
      message: 'Step image uploaded successfully',
      image: step.image
    });
  } catch (error) {
    console.error('📷 Upload error:', error);
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
      const oldPublicId = step.image.split('/').slice(-1)[0].split('.')[0];
      await cloudinary.uploader.destroy(`snaptrack/steps/${oldPublicId}`);
    }

    step.image = null;
    await step.save();

    res.json({ message: 'Step image removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
