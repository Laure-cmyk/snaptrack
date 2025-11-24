import express from 'express';
import { Rating } from '../models/index.js';

const router = express.Router();

// GET all ratings
router.get('/', async (req, res) => {
  try {
    const ratings = await Rating.find()
      .populate('userId', 'username email')
      .populate('journeyId', 'title');
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET rating by ID
router.get('/:id', async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('journeyId', 'title');
    if (!rating) {
      return res.status(404).json({ error: 'Rating not found' });
    }
    res.json(rating);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new rating
router.post('/', async (req, res) => {
  try {
    const rating = await Rating.create(req.body);
    res.status(201).json(rating);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update rating
router.put('/:id', async (req, res) => {
  try {
    const rating = await Rating.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!rating) {
      return res.status(404).json({ error: 'Rating not found' });
    }
    res.json(rating);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE rating
router.delete('/:id', async (req, res) => {
  try {
    const rating = await Rating.findByIdAndDelete(req.params.id);
    if (!rating) {
      return res.status(404).json({ error: 'Rating not found' });
    }
    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
