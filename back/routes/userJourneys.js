import express from 'express';
import { UserJourney } from '../models/index.js';

const router = express.Router();

// GET all user-journeys
router.get('/', async (req, res) => {
  try {
    const userJourneys = await UserJourney.find()
      .populate('userId', 'username email')
      .populate('journeyId', 'title description');
    res.json(userJourneys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user-journey by ID
router.get('/:id', async (req, res) => {
  try {
    const userJourney = await UserJourney.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('journeyId', 'title description');
    if (!userJourney) {
      return res.status(404).json({ error: 'UserJourney not found' });
    }
    res.json(userJourney);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new user-journey
router.post('/', async (req, res) => {
  try {
    const userJourney = await UserJourney.create(req.body);
    res.status(201).json(userJourney);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update user-journey
router.put('/:id', async (req, res) => {
  try {
    const userJourney = await UserJourney.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!userJourney) {
      return res.status(404).json({ error: 'UserJourney not found' });
    }
    res.json(userJourney);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE user-journey
router.delete('/:id', async (req, res) => {
  try {
    const userJourney = await UserJourney.findByIdAndDelete(req.params.id);
    if (!userJourney) {
      return res.status(404).json({ error: 'UserJourney not found' });
    }
    res.json({ message: 'UserJourney deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
