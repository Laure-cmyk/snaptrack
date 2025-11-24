import express from 'express';
import { Journey } from '../models/index.js';

const router = express.Router();

// GET all journeys
router.get('/', async (req, res) => {
  try {
    const journeys = await Journey.find()
      .populate('createdBy', 'username email')
      .populate('groupId', 'name');
    res.json(journeys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET journey by ID
router.get('/:id', async (req, res) => {
  try {
    const journey = await Journey.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('groupId', 'name');
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    res.json(journey);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new journey
router.post('/', async (req, res) => {
  try {
    const journey = await Journey.create(req.body);
    res.status(201).json(journey);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update journey
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

// DELETE journey
router.delete('/:id', async (req, res) => {
  try {
    const journey = await Journey.findByIdAndDelete(req.params.id);
    if (!journey) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    res.json({ message: 'Journey deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
