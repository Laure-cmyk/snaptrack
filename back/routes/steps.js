import express from 'express';
import { Step } from '../models/index.js';

const router = express.Router();

// GET all steps
router.get('/', async (req, res) => {
  try {
    const steps = await Step.find().populate('userJourneyId');
    res.json(steps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET step by ID
router.get('/:id', async (req, res) => {
  try {
    const step = await Step.findById(req.params.id).populate('userJourneyId');
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }
    res.json(step);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new step
router.post('/', async (req, res) => {
  try {
    const step = await Step.create(req.body);
    res.status(201).json(step);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update step
router.put('/:id', async (req, res) => {
  try {
    const step = await Step.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }
    res.json(step);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE step
router.delete('/:id', async (req, res) => {
  try {
    const step = await Step.findByIdAndDelete(req.params.id);
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }
    res.json({ message: 'Step deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
