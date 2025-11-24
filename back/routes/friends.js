import express from 'express';
import { Friends } from '../models/index.js';

const router = express.Router();

// GET all friendships
router.get('/', async (req, res) => {
  try {
    const friends = await Friends.find()
      .populate('userId', 'username email')
      .populate('friendId', 'username email');
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET friendship by ID
router.get('/:id', async (req, res) => {
  try {
    const friendship = await Friends.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('friendId', 'username email');
    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }
    res.json(friendship);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new friendship
router.post('/', async (req, res) => {
  try {
    const friendship = await Friends.create(req.body);
    res.status(201).json(friendship);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update friendship
router.put('/:id', async (req, res) => {
  try {
    const friendship = await Friends.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }
    res.json(friendship);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE friendship
router.delete('/:id', async (req, res) => {
  try {
    const friendship = await Friends.findByIdAndDelete(req.params.id);
    if (!friendship) {
      return res.status(404).json({ error: 'Friendship not found' });
    }
    res.json({ message: 'Friendship deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
