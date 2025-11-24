import express from 'express';
import { Participation } from '../models/index.js';

const router = express.Router();

// GET all participations
router.get('/', async (req, res) => {
  try {
    const participations = await Participation.find()
      .populate('userId', 'username email')
      .populate('journeyId', 'title');
    res.json(participations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET participation by ID
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

// POST create new participation
router.post('/', async (req, res) => {
  try {
    const participation = await Participation.create(req.body);
    res.status(201).json(participation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update participation
router.put('/:id', async (req, res) => {
  try {
    const participation = await Participation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!participation) {
      return res.status(404).json({ error: 'Participation not found' });
    }
    res.json(participation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE participation
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
