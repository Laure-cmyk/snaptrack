import express from 'express';
import { Score } from '../models/index.js';

const router = express.Router();

// GET all scores
router.get('/', async (req, res) => {
  try {
    const scores = await Score.find().populate({
      path: 'userJourneyId',
      populate: [
        { path: 'userId', select: 'username email' },
        { path: 'journeyId', select: 'title' }
      ]
    });
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET score by ID
router.get('/:id', async (req, res) => {
  try {
    const score = await Score.findById(req.params.id).populate({
      path: 'userJourneyId',
      populate: [
        { path: 'userId', select: 'username email' },
        { path: 'journeyId', select: 'title' }
      ]
    });
    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }
    res.json(score);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new score
router.post('/', async (req, res) => {
  try {
    const score = await Score.create(req.body);
    res.status(201).json(score);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update score
router.put('/:id', async (req, res) => {
  try {
    const score = await Score.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }
    res.json(score);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE score
router.delete('/:id', async (req, res) => {
  try {
    const score = await Score.findByIdAndDelete(req.params.id);
    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }
    res.json({ message: 'Score deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
